import { parser } from "@lezer/javascript";
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  flatIndent,
  continuedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
} from "@codemirror/language";
// import { completeFromList, ifNotIn } from "@codemirror/autocomplete";
// import { snippets, typescriptSnippets } from "./snippets";
// import { localCompletionSource, dontComplete } from "./complete";

/// A language provider based on the [Lezer JavaScript
/// parser](https://github.com/lezer-parser/javascript), extended with
/// highlighting and indentation information.
export const javascriptLanguage = LRLanguage.define({
  name: "javascript",
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        IfStatement: continuedIndent({ except: /^\s*({|else\b)/ }),
        TryStatement: continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
        LabeledStatement: flatIndent,
        SwitchBody: (context) => {
          let after = context.textAfter,
            closed = /^\s*\}/.test(after),
            isCase = /^\s*(case|default)\b/.test(after);
          return (
            context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit
          );
        },
        Block: delimitedIndent({ closing: "}" }),
        ArrowFunction: (cx) => cx.baseIndent + cx.unit,
        "TemplateString BlockComment": () => null,
        "Statement Property": continuedIndent({ except: /^\s*{/ }),
        JSXElement(context) {
          let closed = /^\s*<\//.test(context.textAfter);
          return (
            context.lineIndent(context.node.from) + (closed ? 0 : context.unit)
          );
        },
        JSXEscape(context) {
          let closed = /\s*\}/.test(context.textAfter);
          return (
            context.lineIndent(context.node.from) + (closed ? 0 : context.unit)
          );
        },
        "JSXOpenTag JSXSelfClosingTag"(context) {
          return context.column(context.node.from) + context.unit;
        },
      }),
      foldNodeProp.add({
        "Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression ObjectType":
          foldInside,
        BlockComment(tree) {
          return { from: tree.from + 2, to: tree.to - 2 };
        },
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
    wordChars: "$",
  },
});

export function javascript() {
  let lang = javascriptLanguage;
  return new LanguageSupport(lang);
}

// --------------------------------------------------------------------------
// Everything below this block is from the original package with completion,
// autocomplete, etc. Leaving here in case I need to reference it later.
// --------------------------------------------------------------------------

// let kwCompletion = (name: string) => ({ label: name, type: "keyword" });

// const keywords =
//   "break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield"
//     .split(" ")
//     .map(kwCompletion);
// const typescriptKeywords = keywords.concat(
//   ["declare", "implements", "private", "protected", "public"].map(kwCompletion)
// );

/// JavaScript support. Includes [snippet](#lang-javascript.snippets)
/// and local variable completion.

/// JavaScript support. Includes [snippet](#lang-javascript.snippets)
// export function javascript(
//   config: { jsx?: boolean; typescript?: boolean } = {}
// ) {
//   let lang = javascriptLanguage;
//   let completions = config.typescript
//     ? typescriptSnippets.concat(typescriptKeywords)
//     : snippets.concat(keywords);
//   return new LanguageSupport(lang, [
//     javascriptLanguage.data.of({
//       autocomplete: ifNotIn(dontComplete, completeFromList(completions)),
//     }),
//     javascriptLanguage.data.of({
//       autocomplete: localCompletionSource,
//     }),
//   ]);
// }
