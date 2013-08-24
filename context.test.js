/// <reference path="context.js" />

module("context.js");

window.debug = true;

test("Register object, get object back", function () {
	var returnedObj,
		testObj = { test: 1 };

	var ctx = context.create();
	ctx.register("test", testObj);
	returnedObj = ctx.get("test");

	equal(testObj, returnedObj);
});


test("Register function, function is calld", function () {
	var testVal = 0;
	var ret;
	var testFn = function () {
		testVal++;
	};

	var ctx = context.create();
	ctx.register("test", testFn);
	ret = ctx.get("test");
	equal(1, testVal);
});


test("Register function with object dependency", function () {
	var testVal = 0;
	var ret;
	var testObj = { test: 23 };
	var testFn = function (testObj) {
		testVal = testObj.test;
	};

	var ctx = context.create();
	ctx.register("testObj", testObj);
	ctx.register("test", testFn);
	ret = ctx.get("test");
	equal(23, testVal);
});


test("Register function with function dependency", function () {
	var testVal = 0;
	var ret;
	var testDep = function () {
		this.testFn = function () {
			return 23;
		};
	};
	var testFn = function (testDep) {
		testVal = testDep.testFn();
	};

	var ctx = context.create();
	ctx.register("testDep", testDep);
	ctx.register("test", testFn);
	ret = ctx.get("test");
	equal(23, testVal);
});


test("Calling get on an un-registered dependency throws an error", function () {
	expect(1);
	var ctx = context.create();
	try {
		var foo = ctx.get("foo");
	} catch (e) {
		equal(e.message, "Unknown dependency: foo", e.message);
	}
});


test("Circular dependency is caught and error is thrown.", function () {
	var testVal = 0;
	var ret;
	var testDep = function (test) {
		this.testFn = function () {
			return 23;
		};
	};
	var testFn = function (testDep) {
		testVal = testDep.testFn();
	};

	var ctx = context.create();
	ctx.register("testDep", testDep);
	ctx.register("test", testFn);
	try {
		ret = ctx.get("test");
	} catch (e) {
		equal(e.message, "Circular reference: test -> testDep -> test", e.message);
	}
});


test("Calling call satisfies the dependencies.", function () {
	var testVal = 0;
	var ret;
	var testDep = function () {
		this.testFn = function () {
			return 23;
		};
	};
	var testFn = function (testDep) {
		testVal = testDep.testFn();
	};

	var ctx = context.create();
	ctx.register("testDep", testDep);
	ret = ctx.call(testFn);
	equal(23, testVal);
});


test("Calling call satisfies the dependencies and respects passed arguments.", function () {
	var testVal = 0;
	var ret;
	var testDep = function () {
		this.testFn = function () {
			return 22;
		};
	};
	var testFn = function (foo, testDep) {
		testVal = testDep.testFn() + foo;
	};

	var ctx = context.create();
	ctx.register("testDep", testDep);
	ret = ctx.call(testFn, [1]);
	equal(23, testVal);
});


test("Calling call satisfies the dependencies and respects the context.", function () {
	var testVal = 0;
	var ret;
	var testDep = function () {
		this.testFn = function () {
			return 23;
		};
	};
	var testFn = function (testDep) {
		this.testDep = testDep;
		this.contextFn();
	};
	testFn.contextFn = function () {
		testVal = this.testDep.testFn();
	};

	var ctx = context.create();
	ctx.register("testDep", testDep);
	ret = ctx.call(testFn, [], testFn);
	equal(23, testVal);
});



test("Registering multiple dependencies at the same time works.", function () {
	var testVal = 0;
	var ret;
	var testDep = function () {
		this.testFn = function () {
			return 25;
		};
	};
	var testFn = function (testDep) {
		testVal = testDep.testFn();
	};

	var ctx = context.create();
	ctx.register({
		"testDep": testDep,
		"test": testFn
	});
	ret = ctx.get("test");
	equal(25, testVal);
});


test("Passing more arguments than dependencies works on call.", function () {
	var testVal = 0;
	var testFn = function (arg1, arg2) {
		testVal = arg1 + arg2 + arguments[2];
	};

	var ctx = context.create();
	ctx.call(testFn, [1, 2, 3]);
	equal(6, testVal);
});


test("Factory pattern is supported.", function () {

	var Foo = function () {
		return {
			testMethod: function () {
				return 23;
			}
		};
	};

	Foo.prototype = {
		testMethod: function () {
			return 24;
		}
	};

	var ctx = context.create();
	ctx.register("foo", Foo);
	var foo = ctx.get("foo");
	equal(23, foo.testMethod());
});


test("Instantiating a registered object with arguments works.", function () {
	var testFn = function (foo) {
		return {
			test: function () {
				return foo.testVal;
			}
		};
	};

	var ctx = context.create();
	ctx.register("foo", {
		testVal: 24
	});

	ctx.register("test", testFn);

	var test1 = ctx.get("test");
	equal(test1.test(), 24);


	var test2 = ctx.instantiate("test", [{
		testVal: 23
	}]);

	equal(test2.test(), 23);
});


test("Two containers are separated", function () {
	expect(5);

	var testObj = { test: 23 };
	var ctx1 = context.create();
	var ctx2 = context.create();
	ctx1.register("foo", testObj);

	var val1 = ctx1.get("foo");
	var val2;
	try {
		val2 = ctx2.get("foo");
	} catch (e) {
		ok(true);
	}
	equal(val1, testObj);
	notEqual(val2, testObj);
	testObj.test = 24;

	ctx2.register("foo", testObj);
	val2 = ctx2.get("foo");
	equal(val2, testObj);
	equal(ctx1.get("foo").test, 24);
});


test("Calling instantiate with an unregistered name throws an error.", function () {

	expect(1);
	var ctx = context.create();
	try {
		ctx.instantiate("does not exist");
	} catch (e) {
		equal(e.message, "Could not instantiate type not found: does not exist");
	}
});


test("Registering a plain function returns the function.", function () {
	expect(2);
	
	var ctx = context.create();
	ctx.register("testProto", function () {
		ok(true, "The testProto was created with 'new'.");
	});
	
	ctx.register("testFunction", function () {
		ok(true, "The testFunction was registered as a plain function.");
	}, "function");

	var tp = ctx.get("testProto");
	var tf = ctx.get("testFunction");
	tf();
});

test("Functions can be registered by setting the type", function () {
	expect(2);
	
	var outFn;
	var ctx = context.create();
	var fn = function (arg) {
		equal(arg, 23);
	};

	ctx.register("fn", fn);
	try {
		outFn = ctx.get("fn");
	} catch (e) {
		ok(true, "Error thrown");
	}
	
	ctx.register("fn", fn, "function");
	outFn = ctx.get("fn");
	outFn(23);
});


test("The call method adds the current context as the last argument", function () {
	expect(3);
	
	var ctx = context.create();
	ctx.register("foo", function () {
		var ctx2 = arguments[arguments.length - 1];
		this.ctx = ctx2;
		equal(ctx2, ctx);
	});
	
	ctx.register("foo2", function (foo) {
		var ctx2 = arguments[arguments.length - 1];
		equal(ctx2, ctx);
		equal(foo.ctx, ctx);
	});

	ctx.get("foo");
	ctx.get("foo2");
});


test("Calling get with true returns the raw registered object", function () {
	expect(2);
	
	var ctx = context.create();
	var fn = function () { };
	fn.prototype = { bar: 23 };

	ctx.register("foo", fn);

	var outFn = ctx.get("foo", true);
	
	equal(outFn, fn);
	equal(outFn.prototype, fn.prototype);
});