var Base64KeyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var AsciiTo64 = new Array(128);
for (var i = 0; i < 128; ++i) {
    AsciiTo64[i] = 0;
}
for (i = 0; i < 64; ++i) {
    AsciiTo64[Base64KeyChars.charCodeAt(i)] = i;
}

var Reg_Dash = /-/g;
var Reg_Uuid = /^[0-9a-fA-F-]{36}$/;
var Reg_NormalizedUuid = /^[0-9a-fA-F]{32}$/;
var Reg_CompressedUuid = /^[0-9a-zA-Z+/]{22,23}$/;

var UuidUtils = {
    compressUuid: function (uuid, min) {
        if (Reg_Uuid.test(uuid)) {
            uuid = uuid.replace(Reg_Dash, "");
        } else if (!Reg_NormalizedUuid.test(uuid)) {
            return uuid;
        }
        var reserved = min === true ? 2 : 5;
        return UuidUtils.compressHex(uuid, reserved);
    },
    compressHex: function (hexString, reservedHeadLength) {
        var length = hexString.length;
        var i;
        if (typeof reservedHeadLength !== "undefined") {
            i = reservedHeadLength;
        } else {
            i = length % 3;
        }
        var head = hexString.slice(0, i);
        var base64Chars = [];
        while (i < length) {
            var hexVal1 = parseInt(hexString[i], 16);
            var hexVal2 = parseInt(hexString[i + 1], 16);
            var hexVal3 = parseInt(hexString[i + 2], 16);
            base64Chars.push(Base64KeyChars[(hexVal1 << 2) | (hexVal2 >> 2)]);
            base64Chars.push(Base64KeyChars[((hexVal2 & 3) << 4) | hexVal3]);
            i += 3;
        }
        return head + base64Chars.join("");
    },
    decompressUuid: function (str) {
        if (str.length === 23) {
            // decode base64
            var hexChars = [];
            for (var i = 5; i < 23; i += 2) {
                var lhs = AsciiTo64[str.charCodeAt(i)];
                var rhs = AsciiTo64[str.charCodeAt(i + 1)];
                hexChars.push((lhs >> 2).toString(16));
                hexChars.push((((lhs & 3) << 2) | (rhs >> 4)).toString(16));
                hexChars.push((rhs & 0xf).toString(16));
            }
            //
            str = str.slice(0, 5) + hexChars.join("");
        } else if (str.length === 22) {
            // decode base64
            var hexChars = [];
            for (var i = 2; i < 22; i += 2) {
                var lhs = AsciiTo64[str.charCodeAt(i)];
                var rhs = AsciiTo64[str.charCodeAt(i + 1)];
                hexChars.push((lhs >> 2).toString(16));
                hexChars.push((((lhs & 3) << 2) | (rhs >> 4)).toString(16));
                hexChars.push((rhs & 0xf).toString(16));
            }
            //
            str = str.slice(0, 2) + hexChars.join("");
        }
        return [
            str.slice(0, 8),
            str.slice(8, 12),
            str.slice(12, 16),
            str.slice(16, 20),
            str.slice(20),
        ].join("-");
    },
    isUuid: function (str) {
        if (typeof str == "string") {
            return (
                Reg_CompressedUuid.test(str) ||
                Reg_NormalizedUuid.test(str) ||
                Reg_Uuid.test(str)
            );
        } else {
            return false;
        }
    },
};

module.exports = UuidUtils;
