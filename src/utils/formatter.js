import * as prettier from "prettier/standalone";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginHtml from "prettier/plugins/html";
import prettierPluginPostcss from "prettier/plugins/postcss";

export async function formatCode(code, path) {
  if (!path) return code;
  const ext = path.split(".").pop().toLowerCase();

  let parser = null;
  let plugins = [prettierPluginEstree];

  if (["js", "jsx"].includes(ext)) {
    parser = "babel";
    plugins.push(prettierPluginBabel);
  } else if (["ts", "tsx"].includes(ext)) {
    parser = "babel-ts";
    plugins.push(prettierPluginBabel);
  } else if (ext === "css") {
    parser = "css";
    plugins.push(prettierPluginPostcss);
  } else if (ext === "html") {
    parser = "html";
    plugins.push(prettierPluginHtml);
  } else if (ext === "json") {
    parser = "json";
    plugins.push(prettierPluginBabel);
  }

  if (!parser) return code;

  try {
    const formatted = await prettier.format(code, {
      parser,
      plugins,
      semi: true,
      singleQuote: false,
    });
    return formatted;
  } catch (err) {
    console.error(`Formatting failed for ${path}:`, err);
    return code; // Fallback to original code
  }
}
