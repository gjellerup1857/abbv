/**
 * This file is part of eyeo's Public API fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// URL of frames where the API needs to be injected
export const apiFrameUrl = "https://example.com";

// Event name for triggering the allowlist of the current tab url
export const allowlistingTriggerEvent = "public-api.allowlist-website";
// Event name for replying to the allowlisting action
export const allowlistingResponseEvent = "public-api.website-allowlisted";

