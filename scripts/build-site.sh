#!/usr/bin/env bash
#
# Builds the hosted site into _site/:
#   /            -> the current site (this working tree), built as its manifest entry says
#   /v/<x.y>/    -> each version listed in archive/versions.json, pulled from git
#   /archive/    -> the version switcher, its manifest, and the archived versions' analytics
#
# Versions are plain static files, unless the manifest gives them a "build":
#   "next"  -> built with npm and exported for their sub-folder (v0.3)
#   "astro" -> built with pnpm for their sub-folder (v0.5 on); these carry their own
#              version menu and analytics, so nothing is injected into them
#
# With PUBLIC_GA_ID set, the current site asks before it counts visits, and the archived
# versions count the visitors who said yes there, each page view tagged with its version.
#
# Requires: bash, git, perl, tar (and node with npm and pnpm for built versions).
# The repo must have full history and tags.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT="$ROOT/_site"
MANIFEST="$ROOT/archive/versions.json"
SWITCHER_TAG='<script src="/archive/switcher.js" defer></script>'
GA_ID="${PUBLIC_GA_ID:-}"

cd "$ROOT"

fail() { echo "build-site: $*" >&2; exit 1; }

# Copies the site files of a git ref (or the working tree, for HEAD) into a directory.
export_ref() {
	local ref="$1" dest="$2"
	mkdir -p "$dest"

	if [[ "$ref" == "HEAD" ]]; then
		# Use the working tree so uncommitted changes can be previewed locally.
		# In CI the working tree is identical to HEAD. Installed dependencies are
		# never part of the site, even if they are lying around untracked.
		git ls-files -z --cached --others --exclude-standard -- . ':(exclude)node_modules' ':(exclude)**/node_modules' \
			| (cd "$ROOT" && tar --null -T - -cf -) \
			| tar -xf - -C "$dest"
	else
		git rev-parse --verify --quiet "$ref^{commit}" > /dev/null \
			|| fail "ref '$ref' not found (are tags fetched?)"
		git archive "$ref" | tar -xf - -C "$dest"
	fi
}

# Removes repo tooling and metadata that shouldn't be published.
strip_repo_files() {
	local dir="$1"
	rm -rf "$dir"/.github "$dir"/archive "$dir"/scripts "$dir"/_site
	rm -rf "$dir"/node_modules
	rm -f "$dir"/.gitattributes "$dir"/.gitignore "$dir"/README.md "$dir"/LICENSE \
		"$dir"/CNAME "$dir"/package.json "$dir"/package-lock.json "$dir"/pnpm-lock.yaml "$dir"/yarn.lock
	find "$dir" -name '*.swp' -delete
}

# Builds a Next.js version (static export) for /v/<version>/ into a directory.
build_next() {
	local ref="$1" dest="$2" version="$3" work
	work="$(mktemp -d)"
	export_ref "$ref" "$work"
	(
		cd "$work"
		npm ci --no-audit --no-fund --loglevel=error
		NEXT_TELEMETRY_DISABLED=1 BASE_PATH="/v/$version" npm run build
	) >&2 || fail "build of $ref failed"
	[[ -f "$work/out/index.html" ]] || fail "build of $ref produced no out/index.html"
	mkdir -p "$dest"
	cp -R "$work/out/." "$dest/"
	rm -rf "$work"
}

# Builds an Astro version for a base path (/ or /v/<version>/) into a directory.
build_astro() {
	local ref="$1" dest="$2" base="$3" work
	command -v pnpm > /dev/null || fail "pnpm is needed to build $ref"
	work="$(mktemp -d)"
	export_ref "$ref" "$work"
	(
		cd "$work"
		pnpm install --frozen-lockfile --reporter=silent
		ASTRO_TELEMETRY_DISABLED=1 BASE_PATH="$base" pnpm run build
	) >&2 || fail "build of $ref for $base failed"
	[[ -f "$work/dist/index.html" ]] || fail "build of $ref produced no dist/index.html"
	mkdir -p "$dest"
	cp -R "$work/dist/." "$dest/"
	rm -rf "$work"
}

# Strips dead analytics, adds the switcher and analytics (for versions without their
# own), and, for archived versions, noindex.
patch_html() {
	local file="$1" noindex="$2" own="$3" version="$4"
	[[ -f "$file" ]] || fail "missing $file"

	if [[ "$own" == "no" ]]; then
		# Remove the defunct Universal Analytics snippet (comment + loader + config script).
		perl -0pi -e 's{\s*<!--\s*Global site tag.*?-->\s*<script[^>]*googletagmanager[^>]*>\s*</script>\s*<script>.*?</script>}{}s' "$file"

		# Inject the switcher right before </body>.
		SWITCHER_TAG="$SWITCHER_TAG" perl -0pi -e 's{</body>}{\t$ENV{SWITCHER_TAG}\n</body>}i' "$file"
		grep -qF "$SWITCHER_TAG" "$file" || fail "could not inject switcher into $file"

		# And the analytics, which count only visitors who allowed them on the current site.
		if [[ -n "$GA_ID" ]]; then
			GA_TAG="<script src=\"/archive/analytics.js\" data-ga=\"$GA_ID\" data-version=\"$version\" defer></script>" \
				perl -0pi -e 's{</body>}{\t$ENV{GA_TAG}\n</body>}i' "$file"
			grep -qF 'src="/archive/analytics.js"' "$file" || fail "could not inject analytics into $file"
		fi
	fi

	if [[ "$noindex" == "yes" ]]; then
		# At the end of <head>: React (in built versions) hydrates the start of <head>
		# and treats a tag inserted there as a mismatch.
		perl -0pi -e 's{</head>}{\t<meta name="robots" content="noindex">\n</head>}i' "$file"
		grep -q 'name="robots" content="noindex"' "$file" || fail "could not add noindex to $file"
	fi

	if grep -q 'UA-125493683' "$file"; then
		fail "analytics snippet still present in $file"
	fi
}

[[ -f "$MANIFEST" ]] || fail "missing $MANIFEST"

rm -rf "$OUT"
mkdir -p "$OUT"

# Current site at the root, built the way its manifest entry says.
IFS=$'\t' read -r current_version current_build < <(perl -MJSON::PP -0777 -ne '
	my ($c) = grep { $_->{current} } @{ decode_json($_) };
	print join("\t", $c->{version}, $c->{build} // "static"), "\n" if $c;
' "$MANIFEST") || fail "no current version in $MANIFEST"

case "$current_build" in
	static)
		export_ref HEAD "$OUT"
		strip_repo_files "$OUT"
		patch_html "$OUT/index.html" no no "$current_version"
		;;
	astro)
		build_astro HEAD "$OUT" "/"
		;;
	*)
		fail "the current version can't be built with '$current_build'"
		;;
esac
echo "built /  (working tree, v$current_version, $current_build)"

# Every archived version under /v/<version>/.
while IFS=$'\t' read -r version ref build; do
	dest="$OUT/v/$version"
	case "$build" in
		static)
			export_ref "$ref" "$dest"
			strip_repo_files "$dest"
			;;
		next)
			build_next "$ref" "$dest" "$version"
			;;
		astro)
			build_astro "$ref" "$dest" "/v/$version"
			;;
		*)
			fail "unknown build type '$build' for $version"
			;;
	esac
	own=no
	[[ "$build" == "astro" ]] && own=yes
	while IFS= read -r -d '' page; do
		patch_html "$page" yes "$own" "$version"
	done < <(find "$dest" -name '*.html' -print0)
	echo "built /v/$version/  ($ref, $build)"
done < <(perl -MJSON::PP -0777 -ne '
	print join("\t", $_->{version}, $_->{ref}, $_->{build} // "static"), "\n" for @{ decode_json($_) };
' "$MANIFEST")

# /v/ itself has no page of its own; send visitors to the current site.
cat > "$OUT/v/index.html" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="robots" content="noindex">
	<meta http-equiv="refresh" content="0; url=/">
	<link rel="canonical" href="/">
	<title>Redirecting…</title>
</head>
<body>
	<a href="/">Go to the current site</a>
</body>
</html>
EOF

# The switcher, its manifest, and the archived versions' analytics.
mkdir -p "$OUT/archive"
cp "$ROOT/archive/switcher.js" "$ROOT/archive/versions.json" "$ROOT/archive/analytics.js" "$OUT/archive/"

echo "done: $OUT"
