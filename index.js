"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindsAloft = void 0;
const axios_1 = __importDefault(require("axios"));
const baseURI = "https://api.weather.gov";
/**
 * Fetch data from a given route at api.weather.gov
 */
const fetch = async (route) => {
    try {
        const { data } = await axios_1.default.get(`${baseURI}${route}`);
        return data;
    }
    catch (err) {
        console.error(`Error fetching ${route}`, err);
    }
};
/**
 * Parse a temperature value from a given winds aloft element
 */
const parseTemp = (element) => {
    // Elements with length 4 contain only wind values
    if (element.length === 4) {
        return { tempC: null };
    }
    // If the element contains +/-, the temperature may be positive or negative
    if (element.match(/[+-]/g)) {
        let tempC;
        tempC = parseInt(element.slice(5));
        if (element.includes("-")) {
            tempC *= -1;
        }
        return { tempC };
    }
    const tempC = parseInt(element.slice(4));
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
const parseWind = (element) => {
    const windDirText = element.slice(0, 2);
    const windSpdText = element.slice(2, 4);
    let windDirectionDegrees = parseInt(`${windDirText}0`);
    let windSpeedKnots = parseInt(`${windSpdText}`);
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
    return { windDirectionDegrees, windSpeedKnots };
};
const parseElement = (element) => ({
    ...parseWind(element),
    ...parseTemp(element),
});
/**
 * Given the data block header row, starting with "FT", determine the column
 * indices where the data elements will be. This can vary between locations,
 * so it's better to programmatically determine the indices.
 */
const determineElementLocations = (headerRow) => {
    const headers = headerRow
        .split(" ")
        .filter((x) => x !== "FT" && x.length > 0);
    const indices = new Map();
    headers.map((header, headerIndex) => {
        const index = headerRow.indexOf(` ${header}`) + 1;
        const lastIndex = headerIndex === 0
            ? header.length - 1
            : indices.get(headers[headerIndex - 1])?.[1] ?? 0;
        const [start, end] = [Number(lastIndex) + 1, index + header.length];
        indices.set(header, [start, end]);
    });
    return indices;
};
const parseDataBlock = (dataBlock) => {
    const [headerRow, ...data] = dataBlock;
    const elementLocations = determineElementLocations(headerRow);
    const parsed = new Map();
    for (const row of data) {
        const station = row.slice(0, 3);
        parsed.set(station, {});
        Array.from(elementLocations.keys()).map((k) => {
            if (Array.isArray(elementLocations.get(k))) {
                const [start, end] = elementLocations.get(k);
                parsed.get(station)[k] = parseElement(row.slice(start, end));
            }
        });
    }
    return Object.fromEntries(parsed);
};
const parseHeaderBlock = (headerBlock, issuanceTime) => {
    const [wmoCollectiveId, issuingOffice, issuanceSeries] = headerBlock.find((row) => row.match(/^FB/g))?.split(" ") ?? [];
    const productCodeAndLocation = headerBlock.find((row) => row.match(/^FD/g));
    const dataBasedOn = headerBlock
        .find((row) => row.match(/^DATA BASED ON/g))
        ?.match(/[0-9]*Z/g)?.[0];
    const timeValid = headerBlock
        .find((row) => row.match(/^VALID/g))
        ?.split(" ")?.[1];
    const timeFromTo = headerBlock
        .find((row) => row.match(/^VALID/g))
        ?.split(" ")?.[6];
    return {
        wmoCollectiveId,
        issuingOffice,
        issuanceSeries,
        productCode: productCodeAndLocation?.slice(0, 3) ?? "",
        productLocation: productCodeAndLocation?.slice(3) ?? "",
        dataBasedOn: buildUtcTime(issuanceTime, dataBasedOn ?? ""),
        timeValid: buildUtcTime(issuanceTime, timeValid ?? ""),
        timeFrom: buildUtcTime(issuanceTime, timeFromTo?.split("-")?.[0] ?? ""),
        timeTo: buildUtcTime(issuanceTime, timeFromTo?.split("-")?.[1]?.slice(0, 4) ?? "", true),
    };
};
const parseProductText = (productText, issuanceTime) => {
    const rows = productText.split("\n");
    const dataBlockRowIndex = rows.findIndex((r) => r.match(/^FT /g));
    const headerBlock = rows
        .slice(0, dataBlockRowIndex)
        .filter((r) => r.length > 0);
    const dataBlock = rows.slice(dataBlockRowIndex).filter((r) => r.length > 0);
    return {
        header: parseHeaderBlock(headerBlock, issuanceTime),
        data: parseDataBlock(dataBlock),
    };
};
/**
 * Dates and times are represented differently in the winds aloft forecast, e.g.,
 * DDHHmm. Here we use a base date, i.e., the issuance date, to determine the
 * full UTC Datetime for these shorthand representations.
 */
const buildUtcTime = (baseDateString, utcTimeString, advanceDate = false) => {
    const newDate = new Date(baseDateString);
    if (utcTimeString.length === 4) {
        newDate.setUTCHours(Number(utcTimeString.slice(0, 2)));
        newDate.setUTCMinutes(Number(utcTimeString.slice(2, 4)));
        if (advanceDate && newDate.valueOf() < new Date(baseDateString).valueOf()) {
            newDate.setUTCDate(newDate.getUTCDate() + 1);
        }
    }
    else {
        newDate.setUTCDate(Number(utcTimeString.slice(0, 2)));
        newDate.setUTCHours(Number(utcTimeString.slice(2, 4)));
        newDate.setUTCMinutes(Number(utcTimeString.slice(4, 6)));
    }
    return newDate;
};
const getProductById = async (id) => {
    const product = await fetch(`/products/${id}`);
    if (product === undefined) {
        return null;
    }
    const parsedProductText = parseProductText(product.productText, product.issuanceTime);
    return {
        id: product.id,
        wmoCollectiveId: product.wmoCollectiveId,
        issuingOffice: product.issuingOffice,
        issuanceTime: product.issuanceTime,
        productCode: product.productCode,
        productName: product.productName,
        productText: product.productText,
        parsedProductText,
    };
};
/**
 * Query the api.weather.gov site for the FD1 (6 Hour Winds Aloft) forecast data
 */
const getWindsAloft = async (productType, { location, issuanceTimeFrom, issuanceTimeTo = new Date(), }) => {
    let products;
    if (location) {
        const { "@graph": graph } = await fetch(`/products/types/${productType}/locations/${location}`);
        products = graph;
    }
    else {
        const { "@graph": graph } = await fetch(`/products/types/${productType}`);
        products = graph;
    }
    products = products.filter((product) => {
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
    const results = await Promise.all(products.map((product) => getProductById(product.id)));
    return results.filter((result) => result !== null);
};
exports.getWindsAloft = getWindsAloft;
