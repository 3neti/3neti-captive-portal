!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e||self).iodine={})}(this,function(e){function t(e,s,i){if(!e.s){if(i instanceof r){if(!i.s)return void(i.o=t.bind(null,e,s));1&s&&(s=i.s),i=i.v}if(i&&i.then)return void i.then(t.bind(null,e,s),t.bind(null,e,2));e.s=s,e.v=i;const n=e.o;n&&n(e)}}const r=/*#__PURE__*/function(){function e(){}return e.prototype.then=function(r,s){const i=new e,n=this.s;if(n){const e=1&n?r:s;if(e){try{t(i,1,e(this.v))}catch(e){t(i,2,e)}return i}return this}return this.o=function(e){try{const n=e.v;1&e.s?t(i,1,r?r(n):n):s?t(i,1,s(n)):t(i,2,n)}catch(e){t(i,2,e)}},i},e}();class s{constructor(){this.locale=void 0,this.messages=this._defaultMessages(),this.defaultFieldName="Value"}_dateCompare(e,t,r,s=!1){return!!this.isDate(e)&&!(!this.isDate(t)&&!this.isInteger(t))&&(t="number"==typeof t?t:t.getTime(),"less"===r&&s?e.getTime()<=t:"less"!==r||s?"more"===r&&s?e.getTime()>=t:"more"!==r||s?void 0:e.getTime()>t:e.getTime()<t)}_defaultMessages(){return{after:"The date must be after: '[PARAM]'",afterOrEqual:"The date must be after or equal to: '[PARAM]'",array:"[FIELD] must be an array",before:"The date must be before: '[PARAM]'",beforeOrEqual:"The date must be before or equal to: '[PARAM]'",boolean:"[FIELD] must be true or false",date:"[FIELD] must be a date",different:"[FIELD] must be different to '[PARAM]'",endingWith:"[FIELD] must end with '[PARAM]'",email:"[FIELD] must be a valid email address",falsy:"[FIELD] must be a falsy value (false, 'false', 0 or '0')",in:"[FIELD] must be one of the following options: [PARAM]",integer:"[FIELD] must be an integer",json:"[FIELD] must be a parsable JSON object string",max:"[FIELD] must be less than or equal to [PARAM]",min:"[FIELD] must be greater than or equal to [PARAM]",maxLength:"[FIELD] must not be greater than '[PARAM]' in character length",minLength:"[FIELD] must not be less than '[PARAM]' character length",notIn:"[FIELD] must not be one of the following options: [PARAM]",numeric:"[FIELD] must be numeric",optional:"[FIELD] is optional",regexMatch:"[FIELD] must satisify the regular expression: [PARAM]",required:"[FIELD] must be present",same:"[FIELD] must be '[PARAM]'",startingWith:"[FIELD] must start with '[PARAM]'",string:"[FIELD] must be a string",truthy:"[FIELD] must be a truthy value (true, 'true', 1 or '1')",url:"[FIELD] must be a valid url",uuid:"[FIELD] must be a valid UUID"}}_prepare(e,t=[]){return t.length?"optional"===t[0]&&this.isOptional(e)?[]:t.filter(e=>"optional"!==e).map(e=>[e,this._titleCase(e.split(":").shift()),e.split(":").slice(1)]):[]}_titleCase(e){return`${e[0].toUpperCase()}${e.slice(1)}`}addRule(e,t){s.prototype[`is${this._titleCase(e)}`]=t}asyncIs(e,s=[]){try{let i;const n=this,a=function(a,o,u){var l=[];for(var f in a)l.push(f);return function(e,s,i){var n,a,o=-1;return function u(l){try{for(;++o<e.length&&(!i||!i());)if((l=s(o))&&l.then){if(!((f=l)instanceof r&&1&f.s))return void l.then(u,a||(a=t.bind(null,n=new r,2)));l=l.v}n?t(n,1,l):n=l}catch(e){t(n||(n=new r),2,e)}var f}(),n}(l,function(t){return r=l[t],Promise.resolve(n[`is${s[r][1]}`].apply(n,[e,s[r][2].join(":")])).then(function(e){return function(){if(!e)return Promise.resolve(s[r][0]).then(function(e){return i=1,e})}()});var r},function(){return i})}(s=n._prepare(e,s));return Promise.resolve(a&&a.then?a.then(function(e){return!i||e}):!i||a)}catch(e){return Promise.reject(e)}}asyncIsValid(e,t=[]){try{return Promise.resolve(this.asyncIs(e,t)).then(function(e){return!0===e})}catch(e){return Promise.reject(e)}}getErrorMessage(e,t){let{param:r,field:s}="object"==typeof t?t:{param:t,field:void 0};const i=e.split(":");let n=i.shift();r=r||i.join(":"),["after","afterOrEqual","before","beforeOrEqual"].includes(n)&&(r=new Date(parseInt(r)).toLocaleTimeString(this.locale,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"numeric",hour12:!1}));let a=[null,void 0,""].includes(r)?this.messages[n]:this.messages[n].replace("[PARAM]",r);return[null,void 0,""].includes(s)?a.replace("[FIELD]",this.defaultFieldName):a.replace("[FIELD]",s)}isAfter(e,t){return this._dateCompare(e,t,"more",!1)}isAfterOrEqual(e,t){return this._dateCompare(e,t,"more",!0)}isArray(e){return Array.isArray(e)}isBefore(e,t){return this._dateCompare(e,t,"less",!1)}isBeforeOrEqual(e,t){return this._dateCompare(e,t,"less",!0)}isBoolean(e){return[!0,!1].includes(e)}isDate(e){return e&&"[object Date]"===Object.prototype.toString.call(e)&&!isNaN(e)}isDifferent(e,t){return e!=t}isEndingWith(e,t){return this.isString(e)&&e.endsWith(t)}isEmail(e){return new RegExp("^\\S+@\\S+[\\.][0-9a-z]+$").test(String(e).toLowerCase())}isFalsy(e){return[0,"0",!1,"false"].includes(e)}isIn(e,t){return("string"==typeof t?t.split(","):t).includes(e)}isInteger(e){return Number.isInteger(e)&&parseInt(e).toString()===e.toString()}isJson(e){try{return"object"==typeof JSON.parse(e)}catch(e){return!1}}isMax(e,t){return parseFloat(e)<=t}isMin(e,t){return parseFloat(e)>=t}isMaxLength(e,t){return"string"==typeof e&&e.length<=t}isMinLength(e,t){return"string"==typeof e&&e.length>=t}isNotIn(e,t){return!this.isIn(e,t)}isNumeric(e){return!isNaN(parseFloat(e))&&isFinite(e)}isOptional(e){return[null,void 0,""].includes(e)}isRegexMatch(e,t){return new RegExp(t).test(String(e))}isRequired(e){return!this.isOptional(e)}isSame(e,t){return e==t}isStartingWith(e,t){return this.isString(e)&&e.startsWith(t)}isString(e){return"string"==typeof e}isTruthy(e){return[1,"1",!0,"true"].includes(e)}isUrl(e){return new RegExp("^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$").test(String(e).toLowerCase())}isUuid(e){return new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$").test(String(e).toLowerCase())}is(e,t=[]){for(let r in t=this._prepare(e,t))if(!this[`is${t[r][1]}`].apply(this,[e,t[r][2].join(":")]))return t[r][0];return!0}isValid(e,t=[]){return!0===this.is(e,t)}setErrorMessages(e){this.messages=e}setErrorMessage(e,t){this.messages[e]=t}setLocale(e){this.locale=e}setDefaultFieldName(e){this.defaultFieldName=e}}"undefined"!=typeof window&&(window.Iodine=new s),e.Iodine=s});
//# sourceMappingURL=iodine.min.umd.js.map
