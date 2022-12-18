/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

export interface Logger extends Pick<Console, LogLevel> {
    newLine(): void;
}

export type LogLevel = 'info' | 'debug' | 'error' | 'warn';

const levels: Record<LogLevel, { threshold: number; color: string }> = {
    error: { threshold: 0, color: '\x1b[31m' }, // red
    warn: { threshold: 1, color: '\x1b[33m' }, // yellow
    info: { threshold: 2, color: '\x1b[0m' }, // default terminal color
    debug: { threshold: 3, color: '\x1b[32m' } // green
};

let levelThreshold: number = levels.info.threshold;

export const LOGGER: Logger = {
    info: (...args) => log('info', ...args),
    error: (...args) => log('error', ...args),
    warn: (...args) => log('warn', ...args),
    debug: (...args) => log('debug', ...args),
    newLine: () => console.log('')
} as const;

function log(level: LogLevel, ...args: any[]): void {
    const levelData = levels[level];
    if (levelThreshold < levelData.threshold) {
        return;
    }
    console[level](levelData.color, ...args, '\x1b[0m');
}

export function configureLogger(level: LogLevel): void;
export function configureLogger(verbose: boolean): void;
export function configureLogger(levelOrVerbose: LogLevel | boolean): void {
    if (typeof levelOrVerbose === 'boolean') {
        const level: LogLevel = levelOrVerbose ? 'debug' : 'info';
        levelThreshold = levels[level].threshold;
    } else {
        levelThreshold = levels[levelOrVerbose].threshold;
    }
}
