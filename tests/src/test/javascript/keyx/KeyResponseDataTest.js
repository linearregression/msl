/**
 * Copyright (c) 2012-2014 Netflix, Inc.  All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Key response data unit tests.
 * 
 * Successful calls to
 * {@link KeyResponseData#create(com.netflix.msl.util.MslContext, org.json.JSONObject)}
 * covered in the individual key response data unit tests.
 * 
 * @author Wesley Miaw <wmiaw@netflix.com>
 */
describe("KeyResponseData", function() {
    /** JSON key master token. */
    var KEY_MASTER_TOKEN = "mastertoken";
    /** JSON key key exchange scheme. */
    var KEY_SCHEME = "scheme";
    /** JSON key key request data. */
    var KEY_KEYDATA = "keydata";
    
    /** MSL context. */
    var ctx;
    
    var MASTER_TOKEN;

    var initialized = false;
    beforeEach(function() {
        if (!initialized) {
            runs(function() {
                MockMslContext$create(EntityAuthenticationScheme.PSK, false, {
                    result: function(c) { ctx = c; },
                    error: function(e) { expect(function() { throw e; }).not.toThrow(); }
                });
            });
            waitsFor(function() { return ctx; }, "ctx", 900);
            
            runs(function() {
                MslTestUtils.getMasterToken(ctx, 1, 1, {
                    result: function(masterToken) { MASTER_TOKEN = masterToken; },
                    error: function(e) { expect(function() { throw e; }).not.toThrow(); }
                });
            });
            waitsFor(function() { return MASTER_TOKEN; }, "master token", 100);
            
            runs(function() { initialized = true; });
        }
    });
    
    it("no master token", function() {
        var exception;
        runs(function() {
            var jo = {};
            jo[KEY_MASTER_TOKEN + "x"] = JSON.parse(JSON.stringify(MASTER_TOKEN));
            jo[KEY_SCHEME] = KeyExchangeScheme.ASYMMETRIC_WRAPPED.name;
            jo[KEY_KEYDATA] = {};
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslEncodingException(MslError.JSON_PARSE_ERROR));
        });
    });
    
    it("no scheme", function() {
        var exception;
        runs(function() {
            var jo = {};
            jo[KEY_MASTER_TOKEN] = JSON.parse(JSON.stringify(MASTER_TOKEN));
            jo[KEY_SCHEME + "x"] = KeyExchangeScheme.ASYMMETRIC_WRAPPED.name;
            jo[KEY_KEYDATA] = {};
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslEncodingException(MslError.JSON_PARSE_ERROR));
        });
    });
    
    it("no keydata", function() {
        var exception;
        runs(function() {
            var jo = {};
            jo[KEY_MASTER_TOKEN] = JSON.parse(JSON.stringify(MASTER_TOKEN));
            jo[KEY_SCHEME] = KeyExchangeScheme.ASYMMETRIC_WRAPPED.name;
            jo[KEY_KEYDATA + "x"] = {};
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslEncodingException(MslError.JSON_PARSE_ERROR));
        });
    });
    
    it("invalid master token", function() {
        var encryptionKey = new Uint8Array(0);
        var hmacKey = new Uint8Array(0);
        var response = new SymmetricWrappedExchange$ResponseData(MASTER_TOKEN, SymmetricWrappedExchange$KeyId.PSK, encryptionKey, hmacKey);
        
        var exception;
        runs(function() {
            var jo = {};
            jo[KEY_MASTER_TOKEN] = {},
            jo[KEY_SCHEME] = KeyExchangeScheme.ASYMMETRIC_WRAPPED.name;
            jo[KEY_KEYDATA] = response.getKeydata();
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslEncodingException(MslError.JSON_PARSE_ERROR));
        });
    });
    
    it("unidentified scheme", function() {
        var exception;
        runs(function() {
            var jo = {};
            jo[KEY_MASTER_TOKEN] = JSON.parse(JSON.stringify(MASTER_TOKEN)),
            jo[KEY_SCHEME] = "x";
            jo[KEY_KEYDATA] = {};
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslKeyExchangeException(MslError.UNIDENTIFIED_KEYX_SCHEME));
        });
    });
    
    it("keyx factory not found", function() {
        var ctx;
        runs(function() {
            MockMslContext$create(EntityAuthenticationScheme.PSK, false, {
                result: function(c) { ctx = c; },
                error: function(e) { expect(function() { throw e; }).not.toThrow(); }
            });
        });
        waitsFor(function() { return ctx; }, "ctx", 100);
        
        var exception;
        runs(function() {
            ctx.removeKeyExchangeFactories(KeyExchangeScheme.ASYMMETRIC_WRAPPED);
            
            var jo = {};
            jo[KEY_MASTER_TOKEN] = JSON.parse(JSON.stringify(MASTER_TOKEN)),
            jo[KEY_SCHEME] = KeyExchangeScheme.ASYMMETRIC_WRAPPED.name;
            jo[KEY_KEYDATA] = {};
            KeyResponseData$parse(ctx, jo, {
                result: function(x) {},
                error: function(e) { exception = e; },
            });
        });
        waitsFor(function() { return exception; }, "exception", 100);
        
        runs(function() {
            var f = function() { throw exception; };
            expect(f).toThrow(new MslKeyExchangeException(MslError.KEYX_FACTORY_NOT_FOUND));
        });
    });
});
