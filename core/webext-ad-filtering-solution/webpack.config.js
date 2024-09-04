/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-env node */

import path from "path";
import url from "url";
import fs from "fs";

import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import GenerateJsonPlugin from "generate-json-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import ExtensionReloader from "webpack-ext-reloader";
import Dotenv from "dotenv-webpack";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const extensionFunctionalPath = path.join(dirname, "test", "extension-functional");
const extensionPerformancePath = path.join(dirname, "test", "extension-performance");
const template = path.join(extensionFunctionalPath, "template.html");
const eweConfigName = "engine";
const eweCustomConfigName = "engine-subs";
const eweDistPath = path.join(dirname, "dist");
const eweCustomOutputPath = path.join(eweDistPath, "ewe-subs");
const scriptsOutputPath = path.join(dirname, "scriptsOutput");
const scriptsOutputMV3Path = path.join(dirname, "scriptsOutput", "test-mv3");
const customMV2SubscriptionsPath =
  path.join(scriptsOutputPath, "custom-mv2-subscriptions.json");
const scriptsOutputPerformancePath = path.join(dirname, "scriptsOutput", "performance-mv3");
const rulesetsMV3Path = path.join(scriptsOutputMV3Path, "rulesets", "rulesets.json");
const rulesetsPerformancePath = path.join(scriptsOutputPerformancePath, "rulesets", "rulesets.json");
const packageJsonPath = path.join(dirname, "package.json");
const snippetsPath =
  path.join(dirname, "node_modules", "@eyeo", "snippets", "index.mjs");
const pollingPath = path.join(dirname, "test", "polling.js");

// Canonical Manifest V2
const mv2 = {
  eweConfigName: eweCustomConfigName,
  ewePath: eweCustomOutputPath,
  manifestVersion: 2,
  background: {scripts: ["ewe-api.js", "background.js"]},
  permissions: ["webRequestBlocking", "<all_urls>"],
  misc: {
    /* nothing */
  },
  options: {
    open_in_tab: true,
    page: "options.html"
  },
  outputPath: "test-mv2"
};

const performanceMV2 = {
  ...mv2,
  eweConfigName,
  ewePath: eweDistPath,
  background: {scripts: ["ewe-api.js", "background.js", "snippets.js",
                         "polling.js"]},
  options: null,
  outputPath: "performance-mv2",
  performance: true
};

// Canonical Manifest V3
const mv3 = {
  eweConfigName,
  ewePath: eweDistPath,
  manifestVersion: 3,
  background: {service_worker: "background.js"},
  permissions: [
    "declarativeNetRequest"
  ],
  misc: {
    host_permissions: ["<all_urls>"],
    minimum_chrome_version: "124",
    ...fs.existsSync(rulesetsMV3Path) ?
      {
        declarative_net_request: JSON.parse(
          fs.readFileSync(rulesetsMV3Path, "utf8"))
      } :
      {}
  },
  options: {
    open_in_tab: true,
    page: "options.html"
  },
  outputPath: "test-mv3"
};

const performanceMV3 = {
  ...mv3,
  misc: {
    host_permissions: ["<all_urls>"],
    minimum_chrome_version: "124",
    ...fs.existsSync(rulesetsPerformancePath) ?
      {
        declarative_net_request: JSON.parse(
          fs.readFileSync(rulesetsPerformancePath, "utf8"))
      } :
      {}
  },
  outputPath: "performance-mv3",
  options: null,
  performance: true
};

function commonPlugins() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  process.env.VERSION = packageJson.version;

  return [
    // This replaces the webpackDotenvPlugin object in our code with values
    // from your environment variables at build time.
    new Dotenv({
      systemvars: true,
      prefix: "webpackDotenvPlugin."
    })
  ];
}

function eweBuild(env, configName, subscriptionFile, silent, outputPath,
                  dependencies) {
  let build = {
    name: configName,
    dependencies,
    entry: {
      api: {
        import: "./sdk/api/index.js",
        library: {name: "EWE", type: "umd"}
      },
      content: "./sdk/content/index.js"
    },
    output: {
      filename: "ewe-[name].js",
      path: outputPath,
      clean: true
    },
    mode: env.release ? "production" : "development",
    optimization: {
      minimize: !!env.release,
      minimizer: [new TerserPlugin({extractComments: false})]
    },
    devtool: env.release ? "source-map" : "inline-source-map",
    performance: {
      hints: false
    },
    resolve: {
      alias: {
        io$: path.resolve(dirname, "./sdk/api/io.js"),
        prefs$: path.resolve(dirname, "./sdk/api/prefs.js"),
        info$: path.resolve(dirname, "./sdk/api/info.js")
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"]
        }
      ]
    },
    plugins: [
      new GenerateJsonPlugin("package.json", {type: "commonjs"}, null, 2),
      ...commonPlugins()
    ]
  };

  if (env.release) {
    // "testing.js" API should not be exposed publicly
    let testingJsPath = path.resolve(dirname, "./sdk/api/testing.js");
    let testingJsStubPath = path.resolve(dirname, "./sdk/api/testing-stub.js");
    build.module.rules[0].exclude = [testingJsPath];
    build.resolve.alias["./testing.js"] = testingJsStubPath;
  }

  // It helps to use webextension-polyfill `browser` in production and
  // inject test `browser` in unit tests.
  build.resolve.alias["./browser.js"] = path.resolve(dirname, "./sdk/api/webext-browser.js");

  if (subscriptionFile) {
    let customSubsFile = path.resolve(dirname, subscriptionFile);
    if (fs.existsSync(customSubsFile)) {
      if (!silent) {
        console.warn(`Using custom subscriptions file (${customSubsFile})`);
      }
      build.resolve.alias["../data/subscriptions.json"] = customSubsFile;
    }
  }

  return build;
}

export default (env = {}) => {
  let builds = [
    eweBuild(env, eweConfigName, null, false, eweDistPath),
    eweBuild(env, eweCustomConfigName, customMV2SubscriptionsPath,
             true, eweCustomOutputPath, [eweConfigName])
  ];

  let extensionReloaderPort = 9090;

  for (let buildVariant of [mv2, mv3, performanceMV2, performanceMV3]) {
    let description = `Manifest version: ${buildVariant.manifestVersion}`;
    if (buildVariant.performance) {
      description = `${description} - performance`;
    }
    let manifest = {
      name: "eyeo's WebExtension Ad-Filtering Solution Test Extension",
      version: "0.0.1",
      description,
      manifest_version: buildVariant.manifestVersion,
      background: buildVariant.background,
      options_ui: buildVariant.options,
      content_scripts: [
        {
          all_frames: true,
          js: ["ewe-content.js"],
          match_about_blank: true,
          matches: ["http://*/*", "https://*/*"],
          run_at: "document_start"
        }
      ],
      permissions: [
        "webNavigation", "webRequest", "scripting", "storage",
        "unlimitedStorage", "tabs",
        ...buildVariant.permissions
      ],
      ...buildVariant.misc
    };

    let plugins = [
      new HtmlWebpackPlugin({
        title: "Functional tests",
        filename: "functional.html",
        inject: "body",
        chunks: ["functional"],
        template
      }),
      new HtmlWebpackPlugin({
        title: "Reload tests",
        filename: "reload.html",
        inject: "body",
        chunks: ["reload"],
        template
      }),
      new HtmlWebpackPlugin({
        title: "Update tests",
        filename: "update.html",
        inject: "body",
        chunks: ["update"],
        template
      }),
      new HtmlWebpackPlugin({
        title: "MV2 MV3 migrate tests",
        filename: "mv2-mv3-migrate.html",
        inject: "body",
        chunks: ["migrate"],
        template
      }),
      new MiniCssExtractPlugin(),
      new GenerateJsonPlugin("manifest.json", manifest, null, 2),
      new CopyPlugin({
        patterns: [
          {from: "ewe-*", context: buildVariant.ewePath},
          {from: path.join(extensionFunctionalPath, "background.js")},
          {from: path.join(extensionFunctionalPath, "index.html")},
          {from: path.join(extensionFunctionalPath, "options.html")},
          {from: path.join(extensionFunctionalPath, "index-options.js")},
          ...buildVariant.manifestVersion >= 3 &&
            fs.existsSync(scriptsOutputMV3Path) ?
            [{from: scriptsOutputMV3Path}] : []
        ]
      }),
      ...commonPlugins()
    ];

    if (buildVariant.performance) {
      plugins = [
        new MiniCssExtractPlugin(),
        new GenerateJsonPlugin("manifest.json", manifest, null, 2),
        new CopyPlugin({
          patterns: [
            {from: "ewe-*", context: buildVariant.ewePath},
            {from: path.join(extensionPerformancePath, "background.js")},
            {from: path.join(extensionPerformancePath, "status.html")},
            {from: path.join(extensionPerformancePath, "status.js")},
            ...buildVariant.manifestVersion >= 3 &&
              fs.existsSync(scriptsOutputPerformancePath) ?
              [{from: scriptsOutputPerformancePath}] : []
          ]
        })];
    }

    if (env.development) {
      plugins.push(
        new ExtensionReloader({
          port: extensionReloaderPort
        }));
    }

    builds.push({
      name: buildVariant.outputPath,
      dependencies: [buildVariant.eweConfigName],
      mode: "development",
      entry: buildVariant.performance ? {
        snippets: {
          import: snippetsPath,
          library: {name: "snippets", type: "umd"}
        },
        polling: {
          import: pollingPath,
          library: {name: "polling", type: "umd"}
        }
      } : {
        functional: path.join(extensionFunctionalPath, "functional.js"),
        reload: path.join(extensionFunctionalPath, "reload-wrap.js"),
        update: path.join(extensionFunctionalPath, "update-wrap.js"),
        migrate: path.join(extensionFunctionalPath, "migrate-wrap.js")
      },
      output: {
        path: path.resolve(dirname, "dist", buildVariant.outputPath),
        clean: true
      },
      optimization: {
        minimize: false
      },
      devtool: "inline-source-map",
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, "css-loader"]
          }
        ]
      },
      plugins,
      watchOptions: {
        ignored: ["**/dist", "**/node_modules"]
      }
    });

    extensionReloaderPort++;
  }

  return builds;
};
