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
import "dotenv/config";
import Dotenv from "dotenv-webpack";
import gulp from "gulp";
import merge from "merge-stream";
import webpackStream from "webpack-stream";
import webpackMerge from "webpack-merge";
import webpackMain from "webpack";
import { sentryWebpackPlugin } from "@sentry/webpack-plugin";

export default function webpack({
  webpackInfo,
  addonName,
  addonVersion,
  sourceMapType
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
                filename: bundle.dest
              },
              resolve: {
                extensions: [".ts", ".js", ".json", ".wasm"],
                alias: webpackInfo.alias,
                symlinks: false
              },
              module: {
                rules: [
                  {
                    test: /info.?/,
                    loader: "wp-template-loader",
                    options: {
                      data: { addonName, addonVersion }
                    }
                  },
                  {
                    test: /\.ts$/,
                    use: [
                      {
                        loader: "ts-loader",
                        options: {
                          onlyCompileBundledFiles: true,
                          // We're running type checks separately due to memory
                          // and performance problems when running them while
                          // building the extension
                          // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1441
                          transpileOnly: true
                        }
                      }
                    ]
                  }
                ]
              },
              plugins: [
                new Dotenv({
                  systemvars: true,
                  defaults: true,
                  silent: true,
                  prefix: "webpackDotenvPlugin."
                }),
                sourceMapType === "source-map"
                  ? sentryWebpackPlugin({
                      authToken: process.env.SENTRY_AUTH_TOKEN,
                      org: "eyeo",
                      project: "adblock-plus",
                      telemetry: false,
                      release: {
                        name: addonVersion
                      },
                      sourcemaps: {
                        assets: "dist/release/**/*.js"
                      }
                    })
                  : null
              ],
              externals: {
                perf_hooks: "self"
              }
            })
          },
          webpackMain
        )
      )
    )
  );
}
