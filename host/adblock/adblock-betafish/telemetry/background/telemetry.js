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

import IPMTelemetry from './telemetry-ipm';
import Telemetry from './telemetry-ping';

export const IPM = new IPMTelemetry('total_ipm_pings', 'next_ipm_ping_time', 'ipm_pingalarm', 'ipm_server_url');
export const TELEMETRY = new Telemetry('total_pings', 'next_ping_time', 'pingalarm', 'ping_server_url');
