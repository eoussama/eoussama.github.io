## Description
Hello, I'm Oussama Essamadi, EOussama for short.

This branch is **v0.3** of my portfolio: the redesign from the [Design Update mockup](https://www.figma.com/file/XziYl1qcWAUZjj1WppDuqI/Portfolio?node-id=0%3A1) (issue #3), built with [Next.js](https://nextjs.org) and [Base UI](https://base-ui.com) and exported as a static site. It is hosted with the other versions at [ouss.es/v/0.3](https://ouss.es/v/0.3/).

## Development
```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm run lint
npm run typecheck
```

The build can be served from a sub-folder by setting `BASE_PATH`, which is how the version archive builds it:

```bash
BASE_PATH=/v/0.3 npm run build
```

## Structure
* `app/`: the page, layout and global styles (design tokens for both themes).
* `components/`: one folder per section or building block, each with a CSS module.
* `data/`: profile, skills and projects. Project stars and forks are a snapshot.
* `components/Decor/shapes.ts`: wave, ribbon and path shapes, copied from the Figma export.

## Social links
* [GitHub](https://github.com/EOussama)
* [LinkedIn](https://www.linkedin.com/in/eoussama)
* [Twitter/X](https://twitter.com/OussamaEssamadi)
* **Email**: [oussama.essamadi@gmail.com](mailto:oussama.essamadi@gmail.com)

## Credits
* Photos by [Sergey Zolkin](https://unsplash.com/photos/_UeY8aTI6d0), [Zan Lazarevic](https://unsplash.com/photos/BKyvWG7D6QA) and [Onur Binay](https://unsplash.com/photos/SJ2-PNJrjOg) on Unsplash.
* Icons from [Iconify](https://iconify.design): Akar Icons, Charm, Element Plus, Ant Design, Material Design Icons, Phosphor, Remix Icon, Simple Line Icons, Topcoat, and [Codicons](https://github.com/microsoft/vscode-codicons) (CC BY 4.0).
