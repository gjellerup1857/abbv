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

import {
  DefaultNotificationPermission,
  DeniedNotificationPermission,
  GrantedNotificationPermission,
} from "./notification.types";

/**
 * This content script, when injected into tab, will
 *  wrap the Notification.requestPermission function, so that it will
 *  return a 'denied' permission if the user hadn't previously granted
 *  permission.
 */
const denyNotificationsRequests = function () {
  window.Notification.requestPermission = function () {
    // When a website checks for the permission, deny it if not granted
    // and allow it if it's already allowed
    return new Promise((resolve) => {
      resolve(
        window.Notification.permission === DefaultNotificationPermission
          ? GrantedNotificationPermission
          : DeniedNotificationPermission,
      );
    });
  };
};

denyNotificationsRequests();
