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

/**
 * @module
 *
 * @borrows module:contentTypes.contentTypes as contentTypes
 * @borrows module:features.Features as Features
 * @borrows module:filterEngine.FilterEngine as FilterEngine
 * @borrows module:synchronizer.Synchronizer as Synchronizer
 * @borrows module:url.parseURL as parseURL
 */

"use strict";

const {contentTypes} = require("./contentTypes");
const {Features} = require("./features");
const {FilterEngine} = require("./filterEngine");
const {Synchronizer} = require("./synchronizer");
const {parseURL} = require("./url");

module.exports = {
  contentTypes,
  Features,
  FilterEngine,
  Synchronizer,
  parseURL
};