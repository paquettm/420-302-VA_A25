import { defineConfig } from "astro/config";
import { passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import rehypeExternalLinks from "rehype-external-links";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from 'rehype-slug';
import starlightSidebarTopics from "starlight-sidebar-topics";
import starlightLinksValidator from 'starlight-links-validator'
import starlightScrollToTop from 'starlight-scroll-to-top';

import sidebar from './src/config/sidebar.ts'
import appConfig from './src/config/website-config.ts'
import starlightThemeGalaxy from 'starlight-theme-galaxy'

// astro.config.mjs
import { defineConfig } from 'astro/config';

/** @type {import('unified').Plugin<[], import('hast').Root>} */
function rehypeRewriteCourseLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      let newHref = href
        .replace(
          'https://github.com/paquettm/420-302-VA_A25/blob/main/ASSIGNMENTS/',
          '/420-302-VA_A25/assignments/'
        )
        .replace(
          'https://github.com/paquettm/420-302-VA_A25/blob/main/LABS/',
          '/420-302-VA_A25/labs/'
        )
        .replace(
          'https://github.com/paquettm/420-302-VA_A25/blob/main/GUIDES/',
          '/420-302-VA_A25/guides/'
        )
        .replace(
          'https://github.com/paquettm/420-302-VA_A25/blob/main/THEORY/',
          '/420-302-VA_A25/theory/'
        );

      // remove `.md` at the end (or before query/hash), add trailing slash, then lowercase
      newHref = newHref
        .replace(/\.md(?=($|[?#]))/i, '/') // foo.md  -> foo/
        .replace(/\/+([?#]|$)/, '/$1')     // collapse multiple slashes before ? or end
        .toLowerCase()                    // everything in lowercase
        .replace(/420-302-VA_A25/i, '420-302-VA_A25');

      node.properties.href = newHref;
    });
  };
}

// small helper; you can also `npm i unist-util-visit` and import it instead
function visit(node, type, fn) {
  if (node.type === type) fn(node);
  if (node.children) {
    for (const child of node.children) visit(child, type, fn);
  }
}

//@see: https://astro.build/config
export default defineConfig({
  site: appConfig.siteURI,
  base: appConfig.baseDirectory,
  integrations: [
    starlight({
      title: appConfig.title,
      favicon: appConfig.favicon,
      social: [
        { icon: 'github', label: 'GitHub', href: appConfig.gitHubRepoUri },
      ],
      tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 4},
      //TODO: add the head property.
      defaultLocale: "en",

      // Load components overrides.
      components: {
        //  TableOfContents: './src/components/ui/CustomToC.astro',
         Header: './src/components/ui/CustomHeader.astro',
      },

      // Load and apply the default custom styles.
      customCss: [
               "./src/styles/index.css",
      ],
      lastUpdated: true,
      plugins: [
        starlightScrollToTop(
          {
            threshold: 10,
            showTooltip: true,
            showProgressRing: true
          }
        ),
        starlightImageZoom(),
        starlightThemeGalaxy(),
      ],
      //TODO: modify the sidebar to include the quick links in src/config/sidebar.ts
      sidebar:[
        ...sidebar
      ]
      //TODO: enable the links validator plugin when the site is ready for production or if you want to validate the links in the site.
      // plugins: [
      //   starlightLinksValidator({
      //     errorOnFallbackPages: false,
      //   }),
      // ],
    }
    ),
  ],
  markdown: {
    rehypePlugins: [
      rehypeRewriteCourseLinks,
      rehypeSlug,
      rehypeHeadingIds,
      // [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypeExternalLinks,
        {
          content: {
            type: "text",
            value: " ↗",
          },
          properties: {
            target: "_blank",
          },
          rel: ["noopener"],
        },
      ],
    ],
  },
  image: {
    service: passthroughImageService()
  }
});



