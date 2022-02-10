const backendIPAddress = `206.189.90.222`;
const apiEndPoint = `http://${backendIPAddress}/api`;
const gatewayURL = `http://$gwaddress:$gwport/`;
const splashURL = `http://${backendIPAddress}/splash`; // image of franchisee
const lguURL = `http://206.189.90.222/lgu`; // image of government sponsor
const landingURL = `http://206.189.90.222/landing`;

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
                        Alpine.store('wikonek').user = obj.body.data.user;
                        console.log(`# - hydrating user`);
                        console.log(Alpine.store('wikonek').user, 'user');
                    }
                    else if (obj.status === 422) {
                        this.registered = false;
                        this.fields.mobile.isValid = false;
                        this.fields.mobile.errorMsg = 'Mobile number is already used.';
                        console.log(`# - displaying error message`);
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
                        console.log(`# - login successful`);
                        this.token = obj.body;
                        console.log(this.token, 'token');
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
    Alpine.store('wikonek', {
        config: {
            pinSize: 4,
            // macAddress: '10:6d:b6:6c:d5:37'
            macAddress: '20:6d:b6:6c:d5:37'
        },
        data: {
            touch: null,
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
        init() {
            console.log('* store->wikonek->init()');
            this.registered = false;
            this.loadCustomValidations();
            this.api_touch();
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
                        console.log('* - failed');
                    }
                })
                // .then(response => response.json())
                // .then(data => {
                //     this.data.setTouch(data.data);
                // })
                // .finally(() => {
                //     // this.registered = this.hasCompletedProfile;
                // })
        },
    })// TODO: update user in new device
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