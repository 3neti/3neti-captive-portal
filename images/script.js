    const gatewayURL = `http://$gwaddress:$gwport/`;
    const baseURL = `http://206.189.90.222/api/`;
    const splashURL = `http://206.189.90.222/splash`;

    document.addEventListener('alpine:init', () => {
        Alpine.data('ingress', () => ({
            show: false,
            milliseconds: 1000 * 3,
            image: 'images/sponsor.png',
            init() {
                console.log(`# data->ingress->init setTimeout (${this.milliseconds} ms)`)
                setTimeout(() => this.$el.classList.add('display-none'), this.milliseconds)
            }
        }))
        Alpine.data('airtime', () => ({
            code: '',
            caption: 'Airtime',
            handle: null,
            get days() {
                return Math.floor(this.code / 86400)
            },
            get hours() {
                return Math.floor((this.code % 86400) / 3600)
            },
            get minutes() {
                return Math.floor(((this.code % 86400) % 3600) / 60)
            },
            get seconds() {
                return ((this.code % 86400) % 3600) % 60;
            },
            get timeRemaining() {
                return `${this.days}:${pad(this.hours, 2)}:${pad(this.minutes, 2)}.${pad(this.seconds, 2)}`
            },
            init() {
                this.api_ctime();
            },
            api_ctime() {
                const url = '/pesofi_ctime/';
                const interval = 1000;
                console.log(`# data.timer.init() fetch-> ${url}`);
                this.handle = setInterval(() => {
                    fetch(url, {method: 'GET'})
                        .then(response => response.text())
                        .then(str => {
                            this.code = parseRemainingTime(str);
                        })
                }, interval);
            },
            reset() {
                clearTimeout(this.handle);
                this.api_ctime();
            }
        }))
        Alpine.data('profile', () => ({
            user: Alpine.store('wikonek').user,
            init() {
                this.$watch('user', (val) => Alpine.store('wikonek').user = val)
            },
            async api_profile() {
                const url = baseURL+`profile/${this.user.mobile}/${this.user.name}/${this.user.birthdate}/${this.user.address}`;
                const authorization = Alpine.store('wikonek').authorization;
                console.log(`** api_profile() -> ${url}`);
                await fetch(url, {method: 'POST', headers: authorization})
                    .then(response => response.json())
                    .then(data => {
                        this.user = data.data.user
                    })
            },
        }))
        Alpine.data('checkin', () => ({
            async api_checkin() {
                const device = Alpine.store('wikonek').data.touch.device.identifier;
                const station = Alpine.store('wikonek').station.identifier;
                const url = baseURL+`checkin/${device}/${station}`;
                const authorization = Alpine.store('wikonek').authorization;
                console.log(`** api_checkin() -> ${url}`);
                await fetch(url, {method: 'POST', headers: authorization})
                    .then(response => response.json())
                    .then(data => {
                        Alpine.store('wikonek').data.setCheckin(data.data)
                    })
                    .then(() => {
                        Alpine.store('wikonek').consumption = Alpine.store('wikonek').dayPass
                    })
                    .then(() => {
                        Alpine.store('wikonek').url_splash = 'images/sponsor.png'
                        Alpine.store('wikonek').url_landing = Alpine.store('wikonek').checkin.url_landing
                    })
            },
        }))
        Alpine.data('count', () => ({
            ticks: null,
            armHandle: null,
            statusHandle: null,
            armed: false,
            coins: null,
            get caption() {
                return this.armed ? 'Stop' : 'Insert Coin';
            },
            get minutes() {
                return Math.floor(((this.ticks % 86400) % 3600) / 60)
            },
            get seconds() {
                return ((this.ticks % 86400) % 3600) % 60;
            },
            get timeRemaining() {
                return `${pad(this.minutes, 2)}:${pad(this.seconds, 2)}`
            },
            set coinsInserted(value) {
                this.coins = value;
            },
            get coinsInserted() {
                return this.coins;
            },
            init() {
                this.reset();
            },
            arm() {
                const interval = 1000;
                this.armed = true;
                this.reset();
                this.armHandle = setInterval(() => {
                    this.ticks--;
                    this.check();
                }, interval);
                this.api_arm();
            },
            check() {
                if (this.ticks <= 0) {
                    this.disarm();
                }
            },
            disarm() {
                this.armed = false;
                clearTimeout(this.armHandle);
                clearTimeout(this.statusHandle)
                this.api_done();
            },
            reset() {
                this.coinsInserted = 0;
                this.ticks = Alpine.store('wikonek').data.session.coins.expiry;
            },
            toggle() {
                this.armed ? this.disarm() : this.arm();
            },
            api_arm() {
                const url = '/pesofi_armcoinslot/';
                console.log(`# data.coin.api_arm() fetch-> ${url}`);
                fetch(url, {method: 'GET'}).then(() => {
                    this.api_status()}
                )
            },
            api_status() {
                const url = `/pesofi_statuscoinslot/`;
                console.log(`# data.coin.api_status() fetch-> ${url}`);
                this.statusHandle = setInterval(() => {
                    fetch(url, {method: 'GET'})
                        .then(response => response.text())
                        .then(str => {
                            this.coinsInserted = parseCoinsInserted(str);
                        })
                }, 500);
            },
            api_done() {
                const url = '/pesofi_donecoinslot/';
                console.log(`# data.coin.api_done() fetch-> ${url}`);
                fetch(url, {method: 'GET'}).then(() => {
                    // this.coinsInserted = 0;
                })
            },
            products: {
                1: $timePerTick/60,
                5: 60,
                10: 240
            }
        }))
        Alpine.data('load', () => ({
            caption: 'Load',
            get loadRemaining() {
                return Alpine.store('wikonek').wallet.load.formatted
            }
        }))
        Alpine.data('purchase', () => ({
            selectedProductCode: null,
            get products() {
                return Alpine.store('wikonek').data.ui.products
            },
            async api_purchase() {
                const code = this.selectedProductCode;
                const product = this.products.find(n => n.code == code)
                const url = baseURL+`purchase/${product.code}`;
                const authorization = Alpine.store('wikonek').authorization;
                console.log(`** api_purchase(${code}) -> ${url}`)
                await fetch(url, {method: 'POST', headers: authorization})
                    .then(response => response.json())
                    .then(data => {
                        Alpine.store('wikonek').data.setPurchase(data.data)
                    })
                    .then(() => {
                        Alpine.store('wikonek').consumption = Alpine.store('wikonek').purchased.airtime
                        Alpine.store('wikonek').user = Alpine.store('wikonek').purchased.user
                    })
                    .then(() => {
                        Alpine.store('wikonek').api_ui();
                    })
                    .finally(() => {

                    })
            }
        }))
        Alpine.data('topup', () => ({
            amount: 0,
            api_topup () {
                console.log('** data autoload go');
                const url = 'https://webapi.tlpe.io/transaction/pay?token=Bearer%20eyJhbGciOiJIUzI1NiJ9.eyJwYXlsb2FkIjoiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKc2FXNXJTV1FpT2lKa05qWTVNVEU1T0MwME9HSXhMVFJsWmpndE9HRmpOeTFrTVRsaE5XSmhNRFl3TkdNaWZRLmMwWHJwSHZLNllCLUJRRGJUWk52ZUlfbTdzUmh2cVM5cVRFajJpQmw1Y1UiLCJ0eXBlIjoiU1RBVElDIiwia2V5IjoiTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBS2VHV2JIdXh5YVR4b2o5UmxTNnJOZG8ySFhoMGROUFBPMVdhdWtGTW5JUkJmUVcrSEtBS0drem5aRlUxMk1SdXVxVWlrRVBmZG5FUVFPanlVeE5oL01DQXdFQUFRPT0ifQ.J-uC8GoerJ5IceqxzOHecX3AnyUxIXPLUHlAt_k4jHg';
                window.location.assign(url);
            }
        }))
        Alpine.data('transfer', () => ({
            mobile: null,
            amount: 0,
            async api_transfer() {
                const url = baseURL+`transfer/${this.mobile}/${this.amount}`;
                const authorization = Alpine.store('wikonek').authorization;
                console.log(`** api_transfer() -> ${url}`)
                await fetch(url, {method: 'POST', headers: authorization})
                    .then(response => response.json())
                    .then(data => {

                    })
                    .finally(() => {
                        Alpine.store('wikonek').api_ui()
                    })
            }
        }))
        Alpine.data('redeem', () => ({
            enteredVoucherCode: null,
            async api_redeem() {
                const voucher = this.enteredVoucherCode;
                const authorization = Alpine.store('wikonek').authorization;
                const url = baseURL+`redeem/${voucher}`;
                console.log(`** api_redeem(${voucher}) -> ${url}`);
                await fetch(url, {method: 'POST', headers: authorization})
                    .then(response => response.json())
                    .then(data => {
                        Alpine.store('wikonek').data.setRedeem(data.data)
                    })
                    .then(() => {
                        Alpine.store('wikonek').consumption = Alpine.store('wikonek').redemption.airtime
                    })
                    .finally(() => {
                        Alpine.store('wikonek').api_ui()
                    })
            },
        }))
        Alpine.data('done', () => ({
            gotoLandingPage() {
                console.log('** gotoLandingPage()');
                window.location.assign('https://fast.com')
                // window.open('https://fast.com', '_blank');
                // Alpine.store('wikonek').url_splash = 'images/sponsor.png'
            }
        }))
        Alpine.store('wikonek', {
            get station() {
                return {
                    identifier: `$gatewaymac`
                }
            },

            get authorization() {
                return {"Authorization": "Bearer "+ this.data.touch.token}
            },

            get isAuthorized() {
                return this.data.touch.token.length > 0
            },

            set user(userObject) {
                this.data.touch.user.mobile = userObject.mobile
                this.data.touch.user.name = userObject.name
                this.data.touch.user.raw_birthdate = userObject.birthdate
                this.data.touch.user.address = userObject.address
                console.log('**** set user from userObject')
                console.log(userObject)
                console.log('**** set user to storage')
                console.log(this.data.touch.user)
            },

            get user() {
                return this.data.touch.user
            },

            get hasCompletedProfile() {
                return !isEmpty(this.data.user.mobile) && !isEmpty(this.data.user.name) && !isEmpty(this.data.user.birthdate) && !isEmpty(this.data.user.address)
            },

            set extension(minutes) {
                console.log(`**** set extension(${minutes})`)
                this.api_extend_airtime(minutes)
            },

            get extension() {
                return this.data.session.extension
            },

            get wallet() {
                return this.data.ui.balance
            },

            set consumption(minutes) {
                console.log(`**** set consumption(${minutes})`)
                this.api_consume(minutes)
            },

            get consumption() {
                return this.data.consume
            },

            get checkin() {
                return this.data.checkin
            },

            get dayPass() {
                return this.checkin.airtime
            },

            set redemption(voucherCode) {
                console.log(`**** set voucher(${voucherCode})`)
                this.api_redeem(voucherCode)
            },

            get redemption() {
                return this.data.redeem
            },

            set purchased(productCode) {
                console.log(`**** set purchased(${productCode})`)
                this.api_purchase(productCode)
            },

            get purchased() {
                return this.data.purchase
            },

            set url_splash(url) {
                this.data.egress.url_splash = url
            },

            get url_splash() {
                return this.data.egress.url_splash
            },

            set url_landing(url) {
                this.data.egress.url_landing = url
            },

            get url_landing() {
                return this.data.egress.url_landing
            },

            get timeleft() {
                return this.data.session.airtime.timeRemaining
            },

            get url_splash() {
                return this.data.session.url.ingress
            },

            get url_landing() {
                return this.data.session.url.egress
            },

            data: {
                session: {
                    airtime: {
                        code: '',
                        get days() {
                            return Math.floor(this.code / 86400)
                        },
                        get hours() {
                            return Math.floor((this.code % 86400) / 3600)
                        },
                        get minutes() {
                            return Math.floor(((this.code % 86400) % 3600) / 60)
                        },
                        get seconds() {
                            return ((this.code % 86400) % 3600) % 60;
                        },
                        get timeRemaining() {
                            return `${this.days}:${pad(this.hours, 2)}:${pad(this.minutes, 2)}.${pad(this.seconds, 2)}`
                        },
                    },
                    extension: 0,
                    coins: {
                        expiry: $queueTime,
                    },
                    url: {
                        ingress: 'splash.png',
                        egress: 'https://fast.com'
                    }
                },
                setIngress(url) {
                    this.session.url.ingress = url
                },
                setEgress(url) {
                    this.session.url.egress = url
                },
                setExtension(minutes) {
                    console.log('*** set data.session.extension from minutes')
                    this.session.extension = minutes
                },
                touch: {
                    token: '',
                    device: {
                        identifier: ''
                    },
                    user: {
                        mobile: '',
                        name: '',
                        raw_birthdate: '',
                        set birthdate(value) {
                            this.raw_birthdate = value
                        },
                        get birthdate() {
                            return this.raw_birthdate ? this.raw_birthdate.split("\/").reverse().join("-") : ''
                        },
                        address: '',
                        get displayName() {
                            return this.name + ' (' + this.mobile + ')'
                        },
                    }
                },
                setTouch(touchObject) {
                    console.log('*** set data.touch from touchObject')
                    console.log(touchObject)
                    this.touch.token = touchObject.token
                    this.touch.device.identifier = touchObject.device.identifier
                    this.touch.user.mobile = touchObject.device.user.mobile
                    this.touch.user.name = touchObject.device.user.name
                    this.touch.user.raw_birthdate = touchObject.device.user.birthdate
                    this.touch.user.address = touchObject.device.user.address
                    console.log('*** set data.touch to storage')
                    console.log(this.touch)
                },
                ui: {
                    balance: {
                        load: {
                            amount: 0.00,
                            units: '',
                            get formatted() {
                                return `${this.amount} ${this.units}`
                            }
                        },
                        airtime: {
                            amount: 0,
                            units: ''
                        }
                    },
                    products: [
                        {
                            code: '1HIA',
                            name: 'UNLI Data 1 Hour',
                            rate: '₱ 5.00'
                        }
                    ]
                },
                setUI(uiObject) {
                    console.log('*** set data.ui from uiObject')
                    console.log(uiObject)
                    this.ui.balance.load.amount = uiObject.balance.load.amount
                    this.ui.balance.load.units = uiObject.balance.load.units
                    this.ui.balance.airtime.amount = uiObject.balance.airtime.amount
                    this.ui.balance.airtime.units = uiObject.balance.airtime.units
                    this.ui.products = uiObject.products
                    console.log('*** set data.ui to storage')
                    console.log(this.ui)
                },
                consume: {
                    minutes: 0,
                    message: '',
                    splash: '',
                    raw_url_splash: '',
                    set url_splash(value) {
                        this.raw_url_splash = value
                    },
                    get url_splash() {
                        return this.raw_url_splash ? this.raw_url_splash : 'http://206.189.90.222/splash'
                    },
                    url_landing: '',
                },
                setConsume(consumeObject) {
                    console.log('*** set data.consume from consumeObject')
                    console.log(consumeObject)
                    this.consume.minutes = consumeObject.minutes
                    this.consume.message = consumeObject.message
                    this.consume.splash = consumeObject.splash
                    this.consume.raw_url_splash = consumeObject.url_splash
                    this.consume.url_landing = consumeObject.url_landing
                    console.log('*** set data.consume to storage')
                    console.log(this.consume)
                },
                checkin: {
                    airtime: 0,
                    message: '',
                    splash: '',
                    raw_url_splash: '',
                    set url_splash(value) {
                        this.raw_url_splash = value
                    },
                    get url_splash() {
                        return this.raw_url_splash ? this.raw_url_splash : 'http://206.189.90.222/splash'
                    },
                    url_landing: '',
                    availed_at: '',
                },
                setCheckin(checkinObject) {
                    console.log('*** set data.checkin from checkinObject')
                    console.log(checkinObject)
                    this.checkin.airtime = checkinObject.airtime
                    this.checkin.message = checkinObject.message
                    this.checkin.splash = checkinObject.splash
                    this.checkin.raw_url_splash = checkinObject.url_splash
                    this.checkin.url_landing = checkinObject.url_landing
                    this.checkin.availed_at = checkinObject.availed_at
                    this.setIngress(this.checkin.url_splash)
                    this.setEgress(this.checkin.url_landing)
                    console.log('*** set data.checkin to storage')
                    console.log(this.checkin)
                },
                purchase: {
                    usage: 0,
                    airtime: 0,
                    topup: 0,
                    product: null,
                    user: null
                },
                setPurchase(purchaseObject) {
                    console.log('*** set data.purchase from purchaseObject')
                    console.log(purchaseObject)
                    this.purchase.usage = purchaseObject.usage
                    this.purchase.airtime = purchaseObject.airtime
                    this.purchase.topup = purchaseObject.topup
                    this.purchase.product = purchaseObject.product
                    this.purchase.user = purchaseObject.user
                    console.log('*** set data.purchase to storage')
                    console.log(this.purchase)
                },
                redeem: {
                    voucher: null,
                    airtime: 0
                },
                setRedeem(redeemObject) {
                    console.log('*** set data.redeem from redeemObject')
                    console.log(redeemObject)
                    this.redeem.voucher = redeemObject.voucher
                    this.redeem.airtime = redeemObject.airtime
                    //TODO: add some more properties here e.g. message, splash, url_splash, url_landing
                    console.log('*** set data.redeem to storage')
                    console.log(this.redeem)
                },
                transfer: {
                    mobile: '',
                    amount: 0
                },
                egress: {
                    url_splash: '',
                    url_landing: ''
                },
            },

            init () {
                console.log('* init()')
                // this.api_ctime()
                this.api_touch().finally(() => {this.api_ui()})
            },

            async api_extend_airtime(minutes) {
                const seconds = minutes * 60;
                const url = gatewayURL+`control.html?timereete=${seconds}`;
                console.log(`** api_extend_airtime(${minutes}) -> ${url}`)
                await fetch(url, {method: 'GET'})
                    .then(response => response.text())
                    .then(str => {
                        this.data.setExtension(minutes)
                        console.log(str)
                    })
            },

            async api_touch() {
                const device = `$clientmac`;
                const device_name = 'mobile';
                const url = baseURL+`touch/${device}/${device_name}`;
                console.log(`** api_touch() -> ${url}`)
                await fetch(url, {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        this.data.setTouch(data.data)
                    })
            },

            async api_ui() {
                const url = baseURL+`ui`
                console.log(`** api_ui() -> ${url}`)
                await fetch(url, {method: 'GET', headers: this.authorization})
                    .then(response => response.json())
                    .then(data => {
                        // this.data.ui = data.data
                        this.data.setUI(data.data)
                    })
            },

            async api_consume(minutes = -1, all = false) {
                const url = baseURL+`consume/${minutes}/${all}`;
                console.log(`** api_consume(${minutes}) -> ${url}`);
                await fetch(url, {method: 'POST', headers: this.authorization})
                    .then(response => response.json())
                    .then(data => {
                        this.data.setConsume(data.data)
                    })
                    .finally(() => {
                        this.extension = this.consumption.minutes
                    })
            },

            async api_checkin() {
                const device = this.data.touch.device.identifier;
                const station = this.station.identifier;
                const url = baseURL+`checkin/${device}/${station}`;
                console.log(`** api_checkin() -> ${url}`);
                await fetch(url, {method: 'POST', headers: this.authorization})
                    .then(response => response.json())
                    .then(data => {
                        this.data.setCheckin(data.data)
                    })
                    .then(() => {
                        this.consumption = this.dayPass
                    })
                    .then(() => {
                        this.url_landing = this.checkin.url_landing
                    })
            },

            async api_ctime() {
                const url = 'http://10.10.10.1/pesofi_ctime/';
                const interval = 1000;
                console.log(`# storarge.api_ctime() fetch-> ${url}`);
                fetch(url, {method: 'GET'})
                    .then(response => response.text())
                    .then(str => {
                        this.data.session.airtime.code = parseRemainingTime(str);
                    })
                // setInterval(() => {
                //     fetch(url, {method: 'GET'})
                //         .then(response => response.text())
                //         .then(str => {
                //             this.data.session.airtime.code = parseRemainingTime(str);
                //         })
                // }, interval);
            },

            coin() {

            },

            done() {
                console.log(`storage.done() ${this.url_landing}`)
                window.location.assign(this.url_landing)
            }
        })
    })

    function isEmpty(str) {
        return str === undefined || str === null
            || typeof str !== 'string'
            || str.match(/^ *$/) !== null;
    }

    function pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }

    function parseRemainingTime(str) {
        return str.substring(str.lastIndexOf('t') + 1, str.lastIndexOf('p'));
    }
    function parseCoinsInserted(str) {
        return str.substring(str.indexOf('parent.coin=') + 12, str.indexOf(';'));
    }