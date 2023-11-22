/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import { port } from "../../../adblockplusui/adblockpluschrome/lib/messaging/port";
import ServerMessages from "~/servermessages";
import { youTubeWallDetected, youTubeNavigation } from "../shared/index";
import { AdWallMessage } from "~/polyfills/shared";

/**
 * Initializes YouTube telemetry
 */
function start(): void {
  port.on(youTubeWallDetected, (message: AdWallMessage): void => {
    ServerMessages.recordAdWallMessage(youTubeWallDetected, message.userLoggedIn ? "1" : "0");
  });
  port.on(youTubeNavigation, (message: AdWallMessage): void => {
    ServerMessages.recordAdWallMessage(youTubeNavigation, message.userLoggedIn ? "1" : "0");
  });

  ext.addTrustedMessageTypes("https://youtube.com", [youTubeWallDetected, youTubeNavigation]);
  ext.addTrustedMessageTypes("https://www.youtube.com", [youTubeWallDetected, youTubeNavigation]);
}

start();
