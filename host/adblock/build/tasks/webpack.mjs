/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import Dotenv from "dotenv-webpack";
import gulp from "gulp";
import merge from "merge-stream";
import webpackStream from "webpack-stream";
import webpackMerge from "webpack-merge";
import webpackMain from "webpack";

export default function webpack({
  webpackInfo,
  addonName,
  addonVersion,
  sourceMapType,
  skipTypeChecks,
}) {
  return merge(
    webpackInfo.bundles.map((bundle) =>
      gulp.src(bundle.src).pipe(
        webpackStream(
          {
            quiet: true,
            config: webpackMerge.merge(webpackInfo.baseConfig, {
              devtool: sourceMapType,
              output: {
                filename: bundle.dest,
              },
              resolve: {
                extensions: [".ts", ".js", ".json", ".wasm", ".jsx"],
                alias: webpackInfo.alias,
                symlinks: false,
              },
              module: {
                rules: [
                  {
                    test: /info.?/,
                    loader: "wp-template-loader",
                    options: {
                      data: { addonName, addonVersion },
                    },
                  },
                  {
                    test: /\.ts$/,
                    use: [
                      {
                        loader: "ts-loader",
                        options: { transpileOnly: skipTypeChecks },
                      },
                    ],
                  },
                  {
                    test: /\.(js|jsx)$/,
                    exclude: (path) => {
                      // Exclude paths that are not our UI components or our react code from the extension.
                      const isExtReactCode = /button\/react-components/.test(path);
                      const isExtUIComponents = /node_modules\/@eyeo\/ext-ui-components/.test(path);
                      return !isExtReactCode && !isExtUIComponents;
                    },
                    use: {
                      loader: "babel-loader",
                      options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                      },
                    },
                  },
                ],
              },
              plugins: [
                new Dotenv({
                  prefix: "webpackDotenvPlugin.",
                  defaults: true,
                  silent: true,
                  systemvars: true,
                }),
              ],
              externals: {
                perf_hooks: "self",
              },
            }),
          },
          webpackMain,
        ),
      ),
    ),
  );
}
