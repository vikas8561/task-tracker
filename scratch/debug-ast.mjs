// Verify the remark callout plugin transforms the AST correctly
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkCallouts from '../src/plugins/remarkCallouts.js';

const md = `> [!NOTE] Test Title
> This is **bold** content with $E=mc^2$.

> [!FORMULA]
> Area = Length × Breadth

> [!question]- What is 2+2?
> **4**

> [!abstract] Chapter Overview
> This chapter builds on **Natural Numbers** and introduces **Whole Numbers**.

> [!fail] Why 3-7 falls off
> Whole numbers stop at **0**.

Regular blockquote without callout syntax.
> This should remain a blockquote.
`;

const tree = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkCallouts)
  .parse(md);

// Apply the plugin (parse only creates the tree, we need to run transforms)
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkCallouts);

const parsed = processor.parse(md);
const transformed = processor.runSync(parsed);

let calloutCount = 0;
let blockquoteCount = 0;

function walk(node, depth = 0) {
  const indent = '  '.repeat(depth);
  if (node.type === 'callout') {
    calloutCount++;
    const props = node.data?.hProperties || {};
    console.log(`${indent}✅ CALLOUT: type=${props['data-callout']}, title="${props['data-callout-title'] || ''}", foldable=${props['data-callout-foldable'] || false}`);
    console.log(`${indent}   Body children: ${node.children.length}`);
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  } else if (node.type === 'blockquote') {
    blockquoteCount++;
    console.log(`${indent}📝 BLOCKQUOTE (not a callout)`);
  } else if (node.type === 'paragraph') {
    const textContent = node.children?.map(c => c.value || `[${c.type}]`).join('');
    console.log(`${indent}📄 paragraph: "${textContent.slice(0, 60)}..."`);
  } else if (node.children) {
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }
}

walk(transformed);
console.log(`\n--- Summary ---`);
console.log(`Callouts found: ${calloutCount}`);
console.log(`Blockquotes remaining: ${blockquoteCount}`);
console.log(`Expected: 5 callouts, 1 blockquote`);
