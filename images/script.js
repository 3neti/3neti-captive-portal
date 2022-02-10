const backendIPAddress = `206.189.90.222`;
const apiEndPoint = `http://${backendIPAddress}/api`;
const gatewayURL = `http://$gwaddress:$gwport/`;
const splashURL = `http://${backendIPAddress}/splash`; // image of franchisee
const lguURL = `http://${backendIPAddress}/lgu`; // image of government sponsor
const landingURL = `http://${backendIPAddress}/landing`;

document.addEventListener('alpine:init', () => {
    Alpine.data('ingress', () => ({
        image: splashURL,
        delay: 2 * 1000, // in milliseconds
        init() {
            console.log(`# data->ingress->init()`);
            setTimeout(() => this.$el.classList.add('display-none'), this.delay);
            console.log(`# - setting splash delay to ${this.delay} ms`);
        }
    }))
    Alpine.data('registration', () => ({
        loading: null,
        isError: null,
        submitted: null,
        agreed: false,
        wantToLogin: false,
        fields: {
            mobile: {
                value: null,
                maxLength: 10,
                rules: ['required', 'regexMobile'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            name: {
                value: null,
                maxLength: 50,
                rules: ['required', 'regexFullName'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            birthdate: {
                value: null,
                rules: ["required", "stringDate", "plausibleDate"],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            address: {
                value: null,
                maxLength: 200,
                rules: ["required"],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            pin: {
                value: null,
                maxLength: Alpine.store('wikonek').config.pinSize,
                rules: ["required", "regexPIN"],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            pin_confirmation: {
                value: null,
                maxLength: Alpine.store('wikonek').config.pinSize,
                rules: ['required', 'regexPIN', 'matchingPIN'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
        },
        token: null,
        get registered() {
            return Alpine.store('wikonek').registered
        },
        get unregistered() {
            return !this.registered;
        },
        get canRegister() {
            return (
                this.fields.mobile.isValid &&
                this.fields.name.isValid &&
                this.fields.birthdate.isValid &&
                this.fields.address.isValid &&
                this.fields.pin.isValid &&
                this.fields.pin_confirmation.isValid
            );
        },
        get canLogin() {
            return (
                this.fields.mobile.isValid &&
                this.fields.pin.isValid
            );
        },
        get wantToRegister() {
            return !this.wantToLogin;
        },
        init() {
            console.log(`# data->registration->init()`);
            Iodine.addRule(
                "matchingPIN",
                (value) => value === this.fields.pin.value
            );
            Iodine.messages.matchingPIN = "Value must match Security PIN";
            console.log('# - matchingPIN loaded');
            this.$watch('agreed', value => {
                if (value) {
                    this.$dispatch('notify', {
                        content: 'You have agreed to the terms of the LyfLyn.Net Customer Service Agreement.',
                        type: 'info'}
                    );
                }
            });
        },
        async api_register() {
            console.log(`# data->registration->api_register()`);
            this.loading = true;
            const url = apiEndPoint+`/profile/${this.fields.mobile.value}/${this.fields.name.value}/${this.fields.birthdate.value}/${this.fields.address.value}/${this.fields.pin.value}`;
            console.log(`# - fetching ${url}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        Alpine.store('wikonek').user = obj.body.data.user;
                        console.log(`# - hydrating user`);
                        console.log(Alpine.store('wikonek').user, 'user');
                        this.$dispatch('notify', { content: `Registration successful!`, type: 'success'});
                    }
                    else if (obj.status === 422) {
                        this.registered = false;
                        this.fields.mobile.isValid = false;
                        this.fields.mobile.errorMsg = 'Mobile number is already used.';
                        console.log(`# - displaying error message`);
                        this.$dispatch('notify', { content: `Registration failed!`, type: 'error'});
                    }
                })
                .catch((error) => {
                    this.isError = true;
                })
                .finally(() => {
                    this.loading = false;
                })
            ;
        },
        async api_login() {
            console.log(`# data->registration->api_login()`);
            const url = apiEndPoint+`/login`;
            console.log(`# - fetching ${url}`);
            const credentials = JSON.stringify({
                email: `63${this.fields.mobile.value}@libreng.email`,
                password: this.fields.pin.value,
                device_name: 'mobile'
            });
            console.log(credentials, 'credentials');
            await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Accept': 'text/plain'},
                body: `${credentials}`
            })
                .then(response =>  response.text().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        this.token = obj.body;
                        console.log(this.token, 'token');
                        this.$dispatch('notify', { content: `Login successful!`, type: 'success'});
                    }
                    else {
                        console.log(`# - failure`);
                        this.$dispatch('notify', { content: `Login failed!`, type: 'error'});
                    }
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
            ;
        },
        async api_associate() {
            console.log(`# data->registration->api_associate()`);
            const device = Alpine.store('wikonek').config.macAddress;
            const url = apiEndPoint+`/associate/${device}`;
            console.log(`# - fetching ${url}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ this.token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - associate successful`);
                        console.log(obj.body, 'json response');
                    }
                    else {
                        console.log(`# - displaying error message`);
                    }
                })
                .catch((error) => {
                    console.log('# - catching error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
        },
        submit() {
            console.log('# data->registration->submit()');
            this.loading = true;
            if (this.wantToRegister) {
                console.log('# - executing api_register');
                this.api_register();
            }
            else if (this.wantToLogin) {
                console.log('# - executing api_login');
                this.api_login().then(() => {
                    if (isEmpty(Alpine.store('wikonek').user.mobile))
                        console.log('# - executing api_associate');
                        this.api_associate();
                });
            }
            this.loading = false;
        },
    }))
    Alpine.data('profile', () => ({
        title: 'Update PIN',
        caption: 'Go!!!',
        fields: {
            old_pin: {
                value: null,
                maxLength: Alpine.store('wikonek').config.pinSize,
                rules: ["required", "regexPIN"],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            pin: {
                value: null,
                maxLength: Alpine.store('wikonek').config.pinSize,
                rules: ["required", "regexPIN"],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            pin_confirmation: {
                value: null,
                maxLength: Alpine.store('wikonek').config.pinSize,
                rules: ['required', 'regexPIN', 'matchPIN'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
        },
        updateProfileSucceeded: false,
        updateProfileFailed: false,
        init() {
            console.log(`# data->profile->init()`);
            Iodine.addRule(
                "matchPIN",
                (value) => value === this.fields.pin.value
            );
            Iodine.messages.matchPIN = "PIN confirmation needs to match PIN";
        },
        get name() {
            return Alpine.store('wikonek').user.name;
        },
        get number() {
            const mobile = Alpine.store('wikonek').user.mobile;
            return mobile.substr(3);
        },
        canUpdate() {
            return this.fields.old_pin.isValid && this.fields.pin.isValid && this.fields.pin_confirmation.isValid;
        },
        clear() {
            console.log('clearing profile');
            this.fields.old_pin.value = '';
            this.fields.old_pin.errorMsg = '';
            this.fields.pin.value = '';
            this.fields.pin.errorMsg = '';
            this.fields.pin_confirmation.value = '';
            this.fields.pin_confirmation.errorMsg = '';
            this.updateProfileSucceeded = null;
            this.updateProfileFailed = null;
        },
        async api_password() {
            console.log(`# data->profile->api_password()`);
            const url = apiEndPoint+`/password/${this.fields.old_pin.value}/${this.fields.pin.value}`;
            console.log(`# - fetching ${url}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        console.log(`# - hydrating user`);
                        this.updateProfileSucceeded = true;
                    }
                    else if (obj.status === 401) {
                        console.log(`# - displaying error message`);
                        this.fields.old_pin.isValid = false;
                        this.fields.old_pin.errorMsg = 'Wrong PIN';
                        this.updateProfileFailed = true;
                    }
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                    setTimeout(() => this.clear(), Alpine.store('wikonek').config.flash.timeout);
                })
            ;
        },
        submit() {
            if (this.canUpdate) {
                this.api_password();
            }
        },
    }))
    Alpine.data('redeem', () => ({
        fields: {
            voucher: {
                value: null,
                maxLength: 9,
                rules: ['required', 'regexVoucher'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
        },
        redemptionSucceeded: null,
        redemptionFailed: null,
        airtime: 0,
        clear() {
            console.log('clearing redemption');
            this.fields.voucher.value = '';
            this.fields.voucher.errorMsg = '';
            this.redemptionSucceeded = null;
            this.redemptionFailed = null;
        },
        get caption() {
            return 'Go!!!';
        },
        get message() {
            return `You have successfully redeemed a voucher with ${this.airtime} minutes of airtime!`
        },
        get canRedeem() {
            return this.fields.voucher.isValid
        },
        async api_redeem() {
            console.log(`# data->redeem->api_redeem()`);
            const voucher = this.fields.voucher.value;
            const authorization = Alpine.store('wikonek').authorization;
            const url = apiEndPoint+`/redeem/${voucher}`;
            console.log(`# - fetching ${url}`);
            console.log(`# - using voucher code ${voucher}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        let redemption = obj.body.data;
                        console.log(`# - redemption data`);
                        console.log(redemption, 'redemption');
                        this.airtime = redemption.airtime;
                        console.log(`# - airtime`);
                        console.log(this.airtime, 'this.airtime');
                        // Alpine.store('wikonek').consumption = this.airtime;
                        // console.log(`# - consume airtime`);
                        console.log(`# - setting UI`);
                        Alpine.store('wikonek').api_ui();
                        // console.log(`# - resetting the field and statuses`);
                    }
                    else if (obj.status === 404) {
                        console.log(`# - voucher code is invalid`);
                        this.fields.voucher.isValid = false;
                        console.log(obj.body.message, `# - displaying error message`);
                        this.fields.voucher.errorMsg = 'Voucher Code is not valid.';
                    }
                    else if (obj.status === 406) {
                        console.log(`# - voucher code is used`);
                        this.fields.voucher.isValid = false;
                        console.log(obj.body.message, `# - displaying error message`);
                        this.fields.voucher.errorMsg = 'Voucher Code is already used.';
                    }
                    else {
                        console.log(`# - general exception`);
                        this.fields.voucher.isValid = false;
                        console.log(`# - displaying error message`);
                        this.fields.voucher.errorMsg = 'Unknown error.';
                    }
                    this.redemptionSucceeded = obj.isOk;
                    this.redemptionFailed = !obj.isOk;
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                    setTimeout(() => this.clear(), Alpine.store('wikonek').config.flash.timeout);
                })
            ;
        },
        submit() {
            if (this.canRedeem) {
                this.api_redeem();
            }
        }
    }))
    Alpine.data('transfer', () => ({
        fields: {
            mobile: {
                value: null,
                maxLength: 10,
                rules: ['required', 'regexMobile'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
            amount: {
                value: null,
                maxLength: 8,
                rules: ['required', 'numeric', 'min:5'],
                validate(callback) {
                    let {isValid, errorMsg} = callback(this);
                    this.isValid = isValid;
                    this.errorMsg = errorMsg;
                },
                isValid: null,
                errorMsg: null
            },
        },
        transferSucceeded: null,
        transferFailed: null,
        get caption() {
            return'Go!!!'
        },
        get message() {
            return `${this.fields.amount.value} successfully transferred to ${this.fields.mobile.value}.`
        },
        get minimumRemittance() {
            return 5.00;
        },
        get canTransfer() {
            return this.fields.mobile.isValid && this.fields.amount.isValid && this.fields.amount.value >= this.minimumRemittance;
        },
        clear() {
            console.log('clearing transfer');
            if (this.transferSucceeded || !this.fields.mobile.isValid) {
                this.fields.mobile.value = '';
                this.fields.mobile.isValid = null;
                this.fields.mobile.errorMsg = null;
            }
            if (this.transferSucceeded || !this.fields.amount.isValid) {
                this.fields.amount.value = null;
                this.fields.amount.isValid = null;
                this.fields.amount.errorMsg = null;
            }
            this.transferSucceeded = null;
            this.transferFailed = null;
        },
        async api_transfer() {
            console.log(`# data->transfer->api_transfer()`);
            const url = apiEndPoint+`/transfer/${this.fields.mobile.value}/${this.fields.amount.value}`;
            console.log(`# - fetching ${url}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        console.log(`# - setting UI`);
                        Alpine.store('wikonek').api_ui();
                    }
                    else if (obj.status === 404) {
                        console.log(`# - mobile number does not exist`);
                        this.fields.mobile.isValid = false;
                        console.log(`# - displaying error message`);
                        this.fields.mobile.errorMsg = 'Mobile number does not exist.';
                    }
                    else if (obj.status === 406) {
                        console.log(`# - insufficient funds`);
                        this.fields.amount.isValid = false;
                        console.log(`# - displaying error message`);
                        this.fields.amount.errorMsg = 'Insufficient funds.';
                    }
                    else {
                        console.log(`# - displaying error message`);
                    }
                    this.transferSucceeded = obj.isOk;
                    this.transferFailed = !obj.isOk;
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                    setTimeout(() => this.clear(), Alpine.store('wikonek').config.flash.timeout);
                })
            ;
        },
        submit() {
            if (this.canTransfer) {
                this.api_transfer();
            }
        }
    }))
    Alpine.data('purchase', () => ({
        image: splashURL,
        purchaseSucceeded: null,
        purchaseFailed: null,
        get title() {
            return 'Product Bundles';
        },
        get caption() {
            return'Go!!!'
        },
        get minimumSpend() {
            return 5.00;
        },
        get canBuy() {
            return +Alpine.store('wikonek').wallet.load.amount >= this.minimumSpend;
        },
        get products() {
            return Alpine.store('wikonek').data.ui.products
        },
        get product() {
            return Alpine.store('wikonek').selectedProduct;
        },
        price(code) {
            const product = this.products.find(n => n.code == code);

            return parseProductRate(product.rate)
        },
        async api_purchase(code) {
            console.log(`# data->transfer->api_purchase()`);
            const product = this.products.find(n => n.code == code)
            const url = apiEndPoint+`/purchase/${product.code}`;
            console.log(`# fetching ${url}`);
            console.log(`# product -> ${product}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        Alpine.store('wikonek').data.purchase = obj.body.data;
                        console.log(`# - setting UI`);
                        Alpine.store('wikonek').api_ui();
                    }
                    else {
                        console.log(`# - displaying error message`);
                    }
                    this.purchaseSucceeded = obj.isOk;
                    this.purchaseFailed = !obj.isOk;
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
                // .then(response => response.json())
                // .then(data => {
                //     Alpine.store('wikonek').data.setPurchase(data.data)
                // })
                // .then(() => {
                //     Alpine.store('wikonek').consumption = Alpine.store('wikonek').purchased.airtime
                //     Alpine.store('wikonek').user = Alpine.store('wikonek').purchased.user
                // })
                // .then(() => {
                //     Alpine.store('wikonek').api_ui();
                // })
        },
        confirm(code) {
            Alpine.store('wikonek').selectedProduct = this.products.find(n => n.code == code);
            this.$dispatch('open-confirm-purchase-modal');
        },
        submit() {
            console.log(`# data->transfer->submit()`);
            this.api_purchase(this.product.code);
            this.$dispatch('open-landing-purchase-modal');
        },
    }))
    Alpine.data('checkin', () => ({
        get claimed() {
            return Alpine.store('wikonek').dayPassClaimed
        },
        get unclaimed() {
            return ! this.claimed;
        },
        get freeMinutes() {
            return Alpine.store('wikonek').dayPass;
        },
        async api_checkin() {
            console.log(`# data->checkin->api_checkin()`);
            const device = Alpine.store('wikonek').data.touch.device.identifier;
            const station = Alpine.store('wikonek').station.identifier;
            const url = apiEndPoint+`/checkin/${device}/${station}`;
            const authorization = Alpine.store('wikonek').authorization;
            console.log(`** api_checkin() -> ${url}`);
            await fetch(url, {
                method: 'POST',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        Alpine.store('wikonek').data.checkin = obj.body.data;
                        console.log(Alpine.store('wikonek').data.checkin, 'checkin');
                    }
                    else {
                        console.log(`# - displaying error message`);
                    }
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
                // .then(response => response.json())
                // .then(data => {
                //     Alpine.store('wikonek').data.setCheckin(data.data)
                // })
                // .then(() => {
                //     Alpine.store('wikonek').consumption = Alpine.store('wikonek').dayPass
                // })
        },
        submit() {
            console.log(`# data->checkin->submit()`);
            this.api_checkin();
            this.$dispatch('open-landing-free-modal');
        }
    }))
    Alpine.data('egress', (operation) => ({
        open: false,
        get image() {
            switch (operation) {
                default:
                    return lguURL;
            }
        },
        get payload() {
            switch (operation) {
                case 'checkin' :
                    return Alpine.store('wikonek').dayPass + ' minutes';
                case 'purchase':
                    return parseProductRate(Alpine.store('wikonek').data.purchase.product.rate);
                case 'count' :
                    return '₱ ' + Alpine.store('wikonek').counted + ' is equivalent to ';
            }
        },
        get message() {
            switch (operation) {
                case 'checkin':
                    return Alpine.store('wikonek').data.checkin.splash;
                case 'purchase':
                    return parseProductRate(Alpine.store('wikonek').data.purchase.product.rate);
                case 'count':
                    let airtime = null;
                    switch (Alpine.store('wikonek').counted) {
                        case '1': airtime = 10; break;
                        case '2': airtime = 20; break;
                        case '3': airtime = 30; break;
                        case '4': airtime = 40; break;
                        case '5': airtime = 60; break;
                        default: airtime = 0;
                    }
                    return airtime + ' minutes';
                default:
                    return 'The world is your oyster!';
            }
        },
        get landing() {
            switch (operation) {
                default:
                    return Alpine.store('wikonek').url_landing
            }
        },
        get caption() {
            switch (operation) {
                default:
                    return 'Go!!!';
            }
        }
    }))
    Alpine.data('dashboard', (mode) => ({
        captions: {
            balance: 'Wallet Balance',
            station: 'Station ID: QC-0001',
            claim: 'Claim your free internet.',
            claimed: 'You already claimed your free internet.',
        },
        get loadRemaining() {
            return (Alpine.store('wikonek').data.ui.balance.load.amount * 1).toLocaleString();
        },
        redeem() {
            this.$dispatch('open-redeem-modal');
        },
        transfer() {
            this.$dispatch('open-transfer-modal');
        },
    }))
    Alpine.store('wikonek', {
        config: {
            pinSize: 4,
            // macAddress: '10:6d:b6:6c:d5:37'
            macAddress: '20:6d:b6:6c:d5:37',
            stationID: '803F5D9D9419',
            flash: {
                timeout: 10 * 1000,
            }
        },
        data: {
            touch: {
                day_pass_today: null,
                device: {
                    user: {
                        mobile: '',
                        get prefix() {
                            return '+63'
                        },
                        set number(value) {
                            this.mobile = this.prefix + value;
                        },
                        get number() {
                            return this.mobile.substr(3)
                        },
                        name: '',
                        birthdate: '1971-03-05',
                        address: '',
                        get displayName() {
                            return this.name + ' (' + this.mobile + ')'
                        },
                        email: ''
                    },
                }
            },
            station: {
                user: {
                    mobile: ''
                }
            },
            ui: {
                balance: {
                    load: {
                        amount: 5370.00,
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
            checkin: {
                splash: '',
                airtime: 0,
            },
            purchase: {
                product: {
                    rate: 'P 0.00',
                }
            }
        },
        selectedProduct: {
            code: '1HIA',
            name: 'UNLI Data 1 Hour',
            rate: '₱ 5.00'
        },
        get token() {
            return this.data.touch.token;
        },
        get device() {
            return this.data.touch.device;
        },
        get user() {
            return this.device.user;
        },
        set user(value) {
            this.device.user = value;
        },
        get registered() {
            return this.data.touch && this.device && this.user && this.user.mobile;
        },
        get station() {
            return this.data.station;
        },
        get manager() {
            return this.station.user;
        },
        get tinderaMode() {
            let retval = false;
            if (typeof this.manager === 'object' && this.manager !== null) {
                if (typeof this.user === 'object' && this.user !== null) {
                    if (this.manager.id == this.user.id) {
                        retval = true;
                    }
                }
            }

            return retval;
        },
        get userMode() {
            return !this.tinderaMode;
        },
        get wallet() {
            return this.data.ui.balance
        },
        get dayPassClaimed() {
            let retval = false;
            if (this.data.touch.day_pass_today != null) {
                if (+this.data.touch.day_pass_today.availed > 0) {
                    retval = true;
                }
            }
            return retval;
        },
        get dayPass() {
            return this.data.checkin.airtime
        },
        get url_landing() {
            return landingURL;
        },
        init() {
            console.log('* store->wikonek->init()');
            this.registered = false;
            this.loadCustomValidations();
            this.api_touch()
                .then(() => this.api_station())
                .finally(() => {this.api_ui()});
        },
        loadCustomValidations() {
            console.log('** store->wikonek->loadCustomValidations()');
            Iodine.addRule(
                "regexFullName",
                (value) => Iodine.isRegexMatch(value, "(\\b[A-Za-z]+)( )([A-Za-z]+\\b)")
            );
            Iodine.messages.regexFullName = "Value must match [First Name] [Last Name]";
            console.log('** - regexFullName loaded');
            Iodine.addRule(
                "regexMobile",
                (value) => Iodine.isRegexMatch(value, "9\\d{9}$")
            );
            Iodine.messages.regexMobile = "Value must match 9#########";
            console.log('** - regexMobile loaded');
            Iodine.addRule(
                "stringDate",
                (value) => Iodine.isDate(new Date(value))
            );
            Iodine.messages.stringDate = "Value must be a date";
            console.log('** - stringDate loaded');
            Iodine.addRule(
                "plausibleDate",
                (value) => moment(value).isBetween(moment().subtract(100,'years'), moment().subtract(10,'years'))
            )
            Iodine.messages.plausibleDate = "Value must be betweeen -100 years and -10 years from today";
            console.log('** - plausibleDate loaded');
            Iodine.addRule(
                "regexPIN",
                (value) => Iodine.isRegexMatch(value, `\\d{${this.config.pinSize}}$`)
            );
            Iodine.messages.regexPIN = "Value must match ####";
            console.log('** - regexPIN loaded');
            Iodine.addRule(
                "regexVoucher",
                (value) => Iodine.isRegexMatch(value, "^\\w{4}\\-?\\w{4}$")
            );
            Iodine.messages.regexVoucher = "Value must match ****-****";
            console.log('** - regexVoucher loaded');
        },
        async api_touch() {
            console.log('* store->wikonek->api_touch()');
            const device = this.config.macAddress;
            const device_name = 'mobile';
            const url = apiEndPoint+`/touch/${device}/${device_name}`;
            console.log(`** api_touch() -> ${url}`)
            await fetch(url, {method: 'POST'})
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`* - successful`);
                        this.data.touch = obj.body.data;
                        console.log(`* - touch`);
                        console.log(this.data.touch, 'touch');
                    }
                    else {
                        console.log('* - failure');
                    }
                })
                // .then(response => response.json())
                // .then(data => {
                //     this.data.setTouch(data.data);
                // })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                    // this.registered = this.hasCompletedProfile;
                })
        },
        async api_station() {
            console.log('* store->wikonek->api_station()');
            const station = this.config.stationID;
            const url = apiEndPoint+`/stations/${station}`;
            console.log(`** api_station() -> ${url}`)
            await fetch(url, {
                method: 'GET',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        this.data.station = obj.body.data;
                        console.log('* - station');
                        console.log(this.station, 'station');
                        console.log('* - manager');
                        console.log(this.manager, 'manager');
                    }
                    else {
                        console.log(`# - failure`);
                    }
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
        },
        async api_ui() {
            console.log('* store->wikonek->api_ui()');
            const url = apiEndPoint+`/ui`
            console.log(`** api_ui() -> ${url}`)
            await fetch(url, {
                method: 'GET',
                headers: {"Authorization": "Bearer "+ Alpine.store('wikonek').token}
            })
                .then(response =>  response.json().then(data => ({status: response.status, body: data, isOk: response.ok})))
                .then(obj => {
                    if (obj.isOk === true) {
                        console.log(`# - successful`);
                        this.data.ui = obj.body.data;
                        console.log(this.data.ui, 'ui');
                    }
                    else {
                        console.log(`# - failure`);
                    }
                })
                .catch((error) => {
                    console.log('# - error');
                })
                .finally(() => {
                    console.log('# - finally');
                })
                // .then(data => {
                //     // this.data.ui = data.data
                //     this.data.setUI(data.data)
                // })
        },
    })
})

function validationCallback(field) {
    let {value, rules} = field;
    let isValid = Iodine.isValid(value, rules);
    let errorMsg = isValid
        ? null
        : Iodine.getErrorMessage(Iodine.is(value, rules));

    return {isValid, errorMsg};
}
function isEmpty(str) {
    return str === undefined || str === null
        || typeof str !== 'string'
        || str.match(/^ *$/) !== null;
}
function parseProductRate(str) {
    return +str.substring(str.lastIndexOf('₱')+1)
}