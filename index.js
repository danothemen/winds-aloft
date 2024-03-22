"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindsAloft = void 0;
var axios_1 = require("axios");
var baseURI = "https://api.weather.gov";
/**
 * Fetch data from a given route at api.weather.gov
 */
var fetch = function (route) { return __awaiter(void 0, void 0, void 0, function () {
    var data, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.get("".concat(baseURI).concat(route))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
            case 2:
                err_1 = _a.sent();
                console.error("Error fetching ".concat(route), err_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * Parse a temperature value from a given winds aloft element
 */
var parseTemp = function (element) {
    // Elements with length 4 contain only wind values
    if (element.length === 4) {
        return { tempC: null };
    }
    // If the element contains +/-, the temperature may be positive or negative
    if (element.match(/[+-]/g)) {
        var tempC_1;
        tempC_1 = parseInt(element.slice(5));
        if (element.includes("-")) {
            tempC_1 *= -1;
        }
        return { tempC: tempC_1 };
    }
    var tempC = parseInt(element.slice(4));
    // Like wind values, stations may not provide temperature values within a
    // certain altitude, so just return null
    if (isNaN(tempC)) {
        return { tempC: null };
    }
    // Otherwise, the temperature will always be negative
    return {
        tempC: -1 * tempC,
    };
};
/**
 * Parse wind direction and speed from a given winds aloft element
 */
var parseWind = function (element) {
    var windDirText = element.slice(0, 2);
    var windSpdText = element.slice(2, 4);
    var windDirectionDegrees = parseInt("".concat(windDirText, "0"));
    var windSpeedKnots = parseInt("".concat(windSpdText));
    // Locations don't always provide wind measurements below a certain
    // altitude and the element will be blank, so just return null
    if (isNaN(windDirectionDegrees) || isNaN(windSpeedKnots)) {
        return {
            windDirectionDegrees: null,
            windSpeedKnots: null,
        };
    }
    // "Light and Variable" winds are represented as 990
    if (windDirectionDegrees === 990 && windSpeedKnots === 0) {
        return {
            windDirectionDegrees: "light and variable",
            windSpeedKnots: "light and variable",
        };
    }
    // If the wind direction in degrees is greater than 360, it means the
    // wind speed was > 100 knots, so adjust the values accordingly
    if (windDirectionDegrees > 360) {
        windDirectionDegrees -= 500;
        windSpeedKnots += 100;
    }
    return { windDirectionDegrees: windDirectionDegrees, windSpeedKnots: windSpeedKnots };
};
/**
 * Given a winds aloft element, parse both wind values and temperature
 */
var parseElement = function (element) { return (__assign(__assign({}, parseWind(element)), parseTemp(element))); };
/**
 * Given the data block header row, starting with "FT", determine the column
 * indices where the data elements will be. This can vary between locations,
 * so it's better to programmatically determine the indices.
 */
var determineElementLocations = function (headerRow) {
    var headers = headerRow
        .split(" ")
        .filter(function (x) { return x !== "FT" && x.length > 0; });
    var indices = {};
    headers.map(function (header, headerIndex) {
        var index = headerRow.indexOf(" ".concat(header)) + 1;
        var lastIndex = headerIndex === 0
            ? header.length - 1
            : indices[headers[headerIndex - 1]][1];
        var _a = [lastIndex + 1, index + header.length], start = _a[0], end = _a[1];
        indices[header] = [start, end];
    });
    return indices;
};
/**
 * Given the data section of the winds aloft forecast, starting with "FT",
 * determine the locations of the data elements and parse them into a JS object.
 */
var parseDataBlock = function (dataBlock) {
    var headerRow = dataBlock[0], data = dataBlock.slice(1);
    var elementLocations = determineElementLocations(headerRow);
    var parsed = {};
    var _loop_1 = function (row) {
        var station = row.slice(0, 3);
        parsed[station] = {};
        Object.keys(elementLocations).map(function (k) {
            var _a = elementLocations[k], start = _a[0], end = _a[1];
            parsed[station][k] = parseElement(row.slice(start, end));
        });
    };
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var row = data_1[_i];
        _loop_1(row);
    }
    return parsed;
};
/**
 * Given the header block of the winds aloft forecast, extract any important
 * values, times, and other information.
 */
var parseHeaderBlock = function (headerBlock) {
    var _a = headerBlock
        .find(function (row) { return row.match(/^FB/g); })
        .split(" "), wmoCollectiveId = _a[0], issuingOffice = _a[1], issuanceSeries = _a[2];
    var productCodeAndLocation = headerBlock.find(function (row) { return row.match(/^FD/g); });
    var dataBasedOn = headerBlock
        .find(function (row) { return row.match(/^DATA BASED ON/g); })
        .match(/[0-9]*Z/g)[0];
    var timeValid = headerBlock
        .find(function (row) { return row.match(/^VALID/g); })
        .split(" ")[1];
    var timeFromTo = headerBlock
        .find(function (row) { return row.match(/^VALID/g); })
        .split(" ")[6];
    return {
        wmoCollectiveId: wmoCollectiveId,
        issuingOffice: issuingOffice,
        issuanceSeries: issuanceSeries,
        productCode: productCodeAndLocation.slice(0, 3),
        productLocation: productCodeAndLocation.slice(3),
        dataBasedOn: dataBasedOn,
        timeValid: timeValid,
        timeFrom: timeFromTo.split("-")[0],
        timeTo: timeFromTo.split("-")[1].slice(0, 4),
    };
};
/**
 * Given the entire product text of the winds aloft forecast, parse the header
 * block information and actual values contained in the forecast.
 */
var parseProductText = function (productText) {
    var rows = productText.split("\n");
    var dataBlockRowIndex = rows.findIndex(function (r) { return r.match(/^FT /g); });
    var headerBlock = rows
        .slice(0, dataBlockRowIndex)
        .filter(function (r) { return r.length > 0; });
    var dataBlock = rows.slice(dataBlockRowIndex).filter(function (r) { return r.length > 0; });
    return {
        header: parseHeaderBlock(headerBlock),
        data: parseDataBlock(dataBlock),
    };
};
/**
 * Dates and times are represented differently in the winds aloft forecast, e.g.,
 * DDHHmm. Here we use a base date, i.e., the issuance date, to determine the
 * full UTC Datetime for these shorthand representations.
 */
var buildUtcTime = function (baseDateString, utcTimeString, advanceDate) {
    if (advanceDate === void 0) { advanceDate = false; }
    var newDate = new Date(baseDateString);
    if (utcTimeString.length === 4) {
        newDate.setUTCHours(utcTimeString.slice(0, 2));
        newDate.setUTCMinutes(utcTimeString.slice(2, 4));
        if (advanceDate && newDate.valueOf() < new Date(baseDateString).valueOf()) {
            newDate.setUTCDate(newDate.getUTCDate() + 1);
        }
    }
    else {
        newDate.setUTCDate(utcTimeString.slice(0, 2));
        newDate.setUTCHours(utcTimeString.slice(2, 4));
        newDate.setUTCMinutes(utcTimeString.slice(4, 6));
    }
    return newDate;
};
/**
 * Query the api.weather.gov site using a specific product ID, parse the result,
 * and return a structured version of the data.
 */
var getProductById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var product, parsedProductText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch("/products/".concat(id))];
            case 1:
                product = _a.sent();
                if (product === undefined) {
                    return [2 /*return*/, null];
                }
                parsedProductText = parseProductText(product.productText);
                parsedProductText.header.dataBasedOn = buildUtcTime(product.issuanceTime, parsedProductText.header.dataBasedOn);
                parsedProductText.header.timeValid = buildUtcTime(product.issuanceTime, parsedProductText.header.timeValid);
                parsedProductText.header.timeFrom = buildUtcTime(product.issuanceTime, parsedProductText.header.timeFrom);
                parsedProductText.header.timeTo = buildUtcTime(product.issuanceTime, parsedProductText.header.timeTo, true);
                return [2 /*return*/, {
                        id: product.id,
                        wmoCollectiveId: product.wmoCollectiveId,
                        issuingOffice: product.issuingOffice,
                        issuanceTime: product.issuanceTime,
                        productCode: product.productCode,
                        productName: product.productName,
                        productText: product.productText,
                        parsedProductText: parsedProductText,
                    }];
        }
    });
}); };
var GetWindsAloftOptions = /** @class */ (function () {
    function GetWindsAloftOptions() {
    }
    return GetWindsAloftOptions;
}());
/**
 * Query the api.weather.gov site for the FD1 (6 Hour Winds Aloft) forecast data
 */
var getWindsAloft = function (productType_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([productType_1], args_1, true), void 0, function (productType, _a) {
        var products, graph, graph, results;
        var _b = _a === void 0 ? new GetWindsAloftOptions() : _a, location = _b.location, issuanceTimeFrom = _b.issuanceTimeFrom, _c = _b.issuanceTimeTo, issuanceTimeTo = _c === void 0 ? new Date() : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!location) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetch("/products/types/".concat(productType, "/locations/").concat(location))];
                case 1:
                    graph = (_d.sent())["@graph"];
                    products = graph;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, fetch("/products/types/".concat(productType))];
                case 3:
                    graph = (_d.sent())["@graph"];
                    products = graph;
                    _d.label = 4;
                case 4:
                    products = products.filter(function (product) {
                        if (issuanceTimeFrom) {
                            if (new Date(issuanceTimeFrom).valueOf() >
                                new Date(product.issuanceTime).valueOf()) {
                                return false;
                            }
                        }
                        if (issuanceTimeTo) {
                            if (new Date(issuanceTimeTo).valueOf() <
                                new Date(product.issuanceTime).valueOf()) {
                                return false;
                            }
                        }
                        return true;
                    });
                    return [4 /*yield*/, Promise.all(products.map(function (product) { return getProductById(product.id); }))];
                case 5:
                    results = _d.sent();
                    return [2 /*return*/, results.filter(function (result) { return result !== null; })];
            }
        });
    });
};
exports.getWindsAloft = getWindsAloft;
