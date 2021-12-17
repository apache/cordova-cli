/*!
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const rewire = require('rewire');
const Insight = require('insight');
const mockStdin = require('mock-stdin');

function restoreAfterEach (obj, prop) {
    const originalValue = obj[prop];
    const restoreProp = Object.prototype.hasOwnProperty.call(obj, prop)
        ? () => { obj[prop] = originalValue; }
        : () => { delete obj[prop]; };

    afterEach(restoreProp);
}

describe('telemetry', () => {
    let telemetry, insight;

    beforeEach(() => {
        telemetry = rewire('../src/telemetry');
        insight = telemetry.__get__('insight');

        // Prevent any settings from being persisted during testing
        insight.config = {
            get (key) { return this[key]; },
            set (key, val) { this[key] = val; }
        };
        for (const key in insight.config) {
            spyOn(insight.config, key).and.callThrough();
        }

        // Prevent tracking anything during testing
        spyOn(Insight.prototype, '_save');

        // Prevent prompts during testing
        spyOn(Insight.prototype, 'askPermission');
    });

    describe('hasUserOptedInOrOut', () => {
        it('is false if insight.optOut is unset [T001]', () => {
            expect(telemetry.hasUserOptedInOrOut()).toBe(false);
            expect(insight.config.get).toHaveBeenCalledWith('optOut');
        });

        it('is true if insight.optOut is set [T002]', () => {
            insight.config.get.and.returnValues(
                false, true, 0, 1, '', 'xxx', null
            );
            for (let i = 0; i < 7; i++) {
                expect(telemetry.hasUserOptedInOrOut()).toBe(true);
            }
            expect(insight.config.get).toHaveBeenCalledTimes(7);
        });
    });

    describe('isOptedIn', () => {
        it('is the inverse of insight.optOut [T003]', () => {
            insight.config.get.and.returnValues(false, true);

            expect(telemetry.isOptedIn()).toBe(true);
            expect(telemetry.isOptedIn()).toBe(false);
            expect(insight.config.get).toHaveBeenCalledTimes(2);
        });

        it('is true if user did not yet decide [T004]', () => {
            expect(telemetry.isOptedIn()).toBe(true);
            expect(insight.config.get).toHaveBeenCalledWith('optOut');
        });
    });

    describe('clear', () => {
        it('clears telemetry setting [T005]', () => {
            telemetry.clear();
            expect(insight.config.set)
                .toHaveBeenCalledWith('optOut', undefined);
        });
    });

    describe('turnOn', () => {
        it('enables the telemetry setting [T006]', () => {
            telemetry.turnOn();
            expect(insight.config.set)
                .toHaveBeenCalledWith('optOut', false);
        });
    });

    describe('turnOff', () => {
        it('disables the telemetry setting [T007]', () => {
            telemetry.turnOff();
            expect(insight.config.set)
                .toHaveBeenCalledWith('optOut', true);
        });
    });

    describe('track', () => {
        beforeEach(() => {
            spyOn(Insight.prototype, 'track');
        });

        it('calls insight.track [T008]', () => {
            telemetry.track();
            expect(insight.track).toHaveBeenCalled();
        });

        it('passes its arguments to insight.track [T009]', () => {
            const args = ['foo', 'bar', 42];
            telemetry.track(...args);
            expect(insight.track).toHaveBeenCalledWith(...args);
        });

        it('filters falsy and empty arguments [T010]', () => {
            const args = [null, [23], [], 42, ''];
            telemetry.track(...args);
            expect(insight.track).toHaveBeenCalledWith([23], 42);
        });
    });

    describe('showPrompt', () => {
        let response;

        beforeEach(() => {
            spyOn(console, 'log');
            spyOn(telemetry, 'track').and.callThrough();
            response = Symbol('response');
            insight.askPermission.and.callFake((_) => {
                insight.optOut = !response;
                return Promise.resolve(response);
            });
        });

        it('calls insight.askPermission [T011]', () => {
            return telemetry.showPrompt().then(_ => {
                expect(insight.askPermission).toHaveBeenCalled();
            });
        });

        it('returns a promise resolved to the user response [T012]', () => {
            return telemetry.showPrompt().then(result => {
                expect(result).toBe(response);
            });
        });

        describe('when user opts in', () => {
            beforeEach(() => {
                response = true;
            });

            it('thanks the user [T013]', () => {
                return telemetry.showPrompt().then(_ => {
                    expect(console.log).toHaveBeenCalledWith(
                        jasmine.stringMatching(/thanks/i)
                    );
                });
            });

            it('tracks the user decision [T014]', () => {
                return telemetry.showPrompt().then(_ => {
                    expect(telemetry.track).toHaveBeenCalledWith(
                        'telemetry', 'on', 'via-cli-prompt-choice', 'successful'
                    );
                    expect(Insight.prototype._save).toHaveBeenCalled();
                });
            });
        });

        describe('when user declines', () => {
            beforeEach(() => {
                response = false;
            });

            it('returns a resolved promise if the user response was negative [T015]', () => {
                return telemetry.showPrompt().then(result => {
                    expect(result).toBe(false);
                });
            });

            it('informs the user [T016]', () => {
                return telemetry.showPrompt().then(_ => {
                    expect(console.log).toHaveBeenCalledWith(
                        jasmine.stringMatching(/opted out of telemetry.* cordova telemetry on/i)
                    );
                });
            });

            it('tracks the user decision [T017]', () => {
                return telemetry.showPrompt().then(_ => {
                    expect(telemetry.track).toHaveBeenCalledWith(
                        'telemetry', 'off', 'via-cli-prompt-choice', 'successful'
                    );
                    expect(Insight.prototype._save).toHaveBeenCalled();
                });
            });
        });

        describe('gory details', () => {
            let stdin;
            beforeEach(() => {
                // Ensure that insight really shows a prompt
                delete process.env.CI;
                process.stdout.isTTY = true;
                insight.askPermission.and.callThrough();

                stdin = mockStdin.stdin();

                // To silence the prompts by insight
                spyOn(process.stdout, 'write');

                // Ensure that prompts are shown for 10ms at most
                telemetry.timeoutInSecs = 0.01;
            });
            afterEach(() => {
                stdin.restore();
            });
            restoreAfterEach(process.env, 'CI');
            restoreAfterEach(process.stdout, 'isTTY');

            it('actually shows a prompt [T025]', () => {
                return telemetry.showPrompt().then(() => {
                    expect(process.stdout.write).toHaveBeenCalled();
                });
            });

            it('saves the user response [T018]', () => {
                process.nextTick(_ => stdin.send('y\n'));
                return telemetry.showPrompt().then(result => {
                    expect(result).toBe(true);
                    expect(insight.config.set)
                        .toHaveBeenCalledWith('optOut', false);
                });
            });

            it('is counted as a negative response if user does not decide [T019]', () => {
                return telemetry.showPrompt().then(result => {
                    expect(result).toBe(false);
                    expect(insight.config.set)
                        .toHaveBeenCalledWith('optOut', true);
                });
            });

            it('does NOT show prompt when running on a CI [T020]', () => {
                process.env.CI = 1;
                return telemetry.showPrompt().then(result => {
                    expect(result).toBe(undefined);
                    expect(insight.config.set).not.toHaveBeenCalled();
                    expect(process.stdout.write).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('insight.track', () => {
        it('tracks without user choice [T021]', () => {
            insight.track();
            expect(insight._save).toHaveBeenCalled();
        });

        it('tracks with user consent [T022]', () => {
            insight.config.get.and.returnValue(false);
            insight.track();
            expect(insight._save).toHaveBeenCalled();
        });

        it('still tracks when user opted out [T023]', () => {
            insight.config.get.and.returnValue(true);
            insight.track();
            expect(insight._save).toHaveBeenCalled();
        });

        describe('on CI', () => {
            beforeEach(() => {
                process.env.CI = 1;
            });
            restoreAfterEach(process.env, 'CI');

            it('does still track [T024]', () => {
                insight.track();
                expect(insight._save).toHaveBeenCalled();
            });
        });
    });
});
