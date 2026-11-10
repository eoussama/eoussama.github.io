#!/usr/bin/env bash
#
# Builds the hosted site into _site/:
#   /            -> the current site (this working tree)
#   /v/<x.y>/    -> each version listed in archive/versions.json, pulled from git
#   /archive/    -> the version switcher and its manifest
#
# Requires: bash, git, perl, tar. The repo must have full history and tags.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT="$ROOT/_site"
MANIFEST="$ROOT/archive/versions.json"
SWITCHER_TAG='<script src="/archive/switcher.js" defer></script>'

cd "$ROOT"

fail() { echo "build-site: $*" >&2; exit 1; }

# Copies the site files of a git ref (or the working tree, for HEAD) into a directory.
export_ref() {
	local ref="$1" dest="$2"
	mkdir -p "$dest"

	if [[ "$ref" == "HEAD" ]]; then
		# Use the working tree so uncommitted changes can be previewed locally.
		# In CI the working tree is identical to HEAD.
		git ls-files -z --cached --others --exclude-standard \
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
	rm -f "$dir"/.gitattributes "$dir"/.gitignore "$dir"/README.md "$dir"/LICENSE \
		"$dir"/CNAME "$dir"/package.json "$dir"/package-lock.json
	find "$dir" -name '*.swp' -delete
}

# Strips dead analytics, injects the switcher and, for archived versions, noindex.
patch_html() {
	local file="$1" noindex="$2"
	[[ -f "$file" ]] || fail "missing $file"

	# Remove the defunct Universal Analytics snippet (comment + loader + config script).
	perl -0pi -e 's{\s*<!--\s*Global site tag.*?-->\s*<script[^>]*googletagmanager[^>]*>\s*</script>\s*<script>.*?</script>}{}s' "$file"

	# Inject the switcher right before </body>.
	SWITCHER_TAG="$SWITCHER_TAG" perl -0pi -e 's{</body>}{\t$ENV{SWITCHER_TAG}\n</body>}i' "$file"
	grep -qF "$SWITCHER_TAG" "$file" || fail "could not inject switcher into $file"

	if [[ "$noindex" == "yes" ]]; then
		perl -0pi -e 's{<head>}{<head>\n\t<meta name="robots" content="noindex">}i' "$file"
		grep -q 'name="robots" content="noindex"' "$file" || fail "could not add noindex to $file"
	fi

	if grep -q 'UA-125493683' "$file"; then
		fail "analytics snippet still present in $file"
	fi
}

[[ -f "$MANIFEST" ]] || fail "missing $MANIFEST"

rm -rf "$OUT"
mkdir -p "$OUT"

# Current site at the root.
export_ref HEAD "$OUT"
strip_repo_files "$OUT"
patch_html "$OUT/index.html" no
echo "built /  (working tree)"

# Every archived version under /v/<version>/.
while IFS=$'\t' read -r version ref; do
	dest="$OUT/v/$version"
	export_ref "$ref" "$dest"
	strip_repo_files "$dest"
	patch_html "$dest/index.html" yes
	echo "built /v/$version/  ($ref)"
done < <(perl -MJSON::PP -0777 -ne '
	print "$_->{version}\t$_->{ref}\n" for @{ decode_json($_) };
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

# The switcher and its manifest.
mkdir -p "$OUT/archive"
cp "$ROOT/archive/switcher.js" "$ROOT/archive/versions.json" "$OUT/archive/"

echo "done: $OUT"
