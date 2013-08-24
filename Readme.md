# context.js
An IOC container.


## register(name, value, type)
Registers an object with the container.
The type is only needed if the value is a plain function not to be used 
as a constructor function (created with the new keyword).
Valid types are "object", "constructor", "function".

## registry
A JavaScript object containing references to all registered objects.

## get
`get(name)`
Retrieves the dependency.
If the dependency is a constructor it will inject and return then 'newed' object as a singleton.

If a second argument passed is _true_ it will retrieve the _raw_ registry value.
So in the case of a constructor function it will return the un-'newed' object.


## call(method, args, context)
A utility method for satisfying the dependencies of a method directly.
The context will be applied to the method call -> 'this'


## instantiate(constructor, args)
Calls the constructor which can also be the name

of a registered dependency.