> 该文章翻译自[Promises/A+](https://promisesaplus.com/#point-49)

**Promise为开发人员提供一个开放、标准、可靠的JavaScript承诺**

一个*promise*代表了一个异步操作的最终结果。Promise提供了最基本的``then``方法来注册回调(callbacks)以接受一个*promise*成功的返回值或者其失败原因。

为了给所有符合Promises/A+规范的Promise实现提供一个规范的可交互的基本方式——``then``，本为详细说明了``then``方法的行为特性。我们应该确保该规范是十分明确以及稳定的。只有在Promises/A+组织经过仔细考虑、讨论和测试后才会新增一些大范围的、不向后兼容的更改，而在通常情况下该组织只是偶尔做一些微小的向后兼容的更改以解决新发现的极端问题。

从历史上看，Promises/A+进一步详细丰富了早期Promises/A提案的行为规范，使规范能够涵盖日常需求的行为并省略了Promises/A中未指明或有问题的部分。

在目前阶段，Promises/A+规范的核心并不是阐明如何创建Promise或者更改其状态为*fulfill*和*reject*，而是选择专注于提供可互操作的``then``方法。而在未来的工作中，一些配套的工具可能会满足以上需求。

# 1. 术语
1.1 ``promise``: 符合本规范并具有``then``方法的一个对象或者函数

1.2 ``thenable``: 定义了``then``方法的一个对象或者函数

1.3 ``value``: 任何符合JavaScript规范的值（可以是 ``undefined``、一个``thenable``或者一个``promise``）

1.4 ``exception``: 被``throw``语句抛出的一个``value``

1.5 ``reason``: 指明一个``promise``为何被转换为``reject``状态的一个``value``

# 2. 要求
## 2.1 Promise状态
一个``promise``的状态必须是以下三个状态中的一个：``pending``、``fulfilled``、``rejected``

2.1.1 当一个``promise``状态为``pending``时：
 
    2.1.1.1 可以将状态转变为``fulfilled``或者``rejected``

2.1.2 当一个``promise``状态为``fulfilled``时：

    2.1.2.1 禁止将状态转变为任何其他状态
    2.1.2.2 必须有一个不可被转变的value

2.1.3 当一个``promise``状态为``rejected``时：

    2.1.3.1 禁止将状态转变为任何其他状态
    2.1.3.2 必须有一个不可被转变的reason

以上描述中的 **禁止转变** 表示一个不可改变的判断（比如 ``===``)，但是不以为之它是深层次不可变。
> 译者注：不太理解，可能是类似对象？
>
> ````
> let a = { name: 'Nicholas' }
> // 可以更改 a.name?
> ````

## 2.2 ``then``方法
一个``promise``必须提供一个可以接触到其目前或者最终状态下的``value``或者``reason``的``then``方法。

``promise``的``then``方法接受两个参数，表现形式如下：
````
promise.then(onFulfilled, onRejected)
````

2.2.1 ``onFulfilled``和``onRejected``方法都不是必需的：
- 如果``onFulfilled``不是一个方法，则必须被忽略
- 如果``onRejected``不是一个方法，则必须被忽略

2.2.2 如果``onFulfilled``是一个方法：
- 该方法只能在``promise``的状态为``fulfilled``后被调用，并且该``promise``的``value``是该方法的第一个参数。
- 该方法在``promise``状态变为``fulfilled``之前禁止被调用。
- 该方法只能被调用一次。

2.2.3 如果``onRejected``是一个方法：
- 该方法只能在``promise``的状态为``rejected``后被调用，并且该``promise``的``reason``是该方法的第一个参数。
- 该方法在``promise``状态变为``rejected``之前禁止被调用。
- 该方法只能被调用一次。

2.2.4 在执行上下文堆栈仅包含平台代码之前，不得调用``onFulfilled``或``onRejected``。
> 译者注：主要是为了保证异步调用两个方法，可以通过塞入宏任务队列或者微任务队列中。

2.2.5 ``onFulfilled``和``onRejected``必须以方法的形式调用（即不得使用``this``)。

2.2.6 ``then``方法在同一个``promise``上可以调用多次：
- 当``promise``状态变为``fulfilled``时（或者已为``fulfilled``时），所有的``onFulfilled``回调都应该按照各自``then``调用的顺序来执行
- 当``promise``状态变为``rejected``时（或者已为``rejected``时），所有的``onRejected``回调都应该按照各自``then``调用的顺序来执行

2.2.7 ``then``方法必须返回一个``promise``:
> ``promise2 = promise1.then(onFulfilled, onRejected)``
- 2.2.7.1 只要``onFulfilled``或者``onRejected``返回一个``value``：``x``，该表达式需要运行 ``Promise Resolution Procedure``，表达式为``[[Resolve]](promise2, x)``
- 2.2.7.2 只要``onFulfilled``或者``onRejected`` ``throw``一个``e``，``promise2``必须以``e``作为理由状态为``rejected``
- 2.2.7.3 如果``onFulfilled``不是一个方法并且``promise1``的状态是``fulfilled``时，``promise2``的状态必须是``fulfilled``并且其``value``应和``promise1``的``value``一样
- 2.2.7.3 如果``onRejected``不是一个方法并且``promise1``的状态是``rejected``时，``promise2``的状态必须是``rejected``并且其``reason``应和``promise1``的``reason``一样

## 2.3 ``Promise Resolution Procedure``
``Promise Resolution Procedure``是一种抽象的操作，它将``promise``和``value``作为输入，表现形式为``[[Resolve]](promise, x)``。如果``x``是一个``thenable``，它（``Promise Resolution Procedure``）会试图将``promise``采用``x``的状态，因为至少``x``看起来像是一个``promise``。否则将``promise``变为``fulfilled``，并将其``value``设定为``x``。

该操作（``Promise Resolution Procedure``）使得满足Promises/A+规范的``promise``可互操作。同时它也使得那些不太规范但是又有``then``方法的一些实现可以互操作。

我们通过以下步骤来运行``Promise Resolution Procedure``：

2.3.1 如果``promise``和``x``是同一个对象，则以``TypeError``reject掉``promise``

2.3.2 如果``x``是一个promise，则采用其状态：
- 如果``x``处于``pending``状态，``promise``必须在``x``变为``fulfilled``或者``rejected``前保持``pending``状态
- 如果/当``x``状态（变）为``fulfilled``，以``x``的``value``resolve``promise``
- 如果/当``x``状态（变）为``rejected``，以``x``的``reason``reject``promise``

2.3.3 其他情况下，如果``x``是一个对象或者方法：
- 让``then``指向``x.then``
- 如果在检索属性``x.then``时抛出了异常``e``，则以``e``为``reason``reject``promise``
- 如果``then``是一个方法，以``x``为上下文执行它，参数即为``then``的参数``resolvePromise``和``rejectPromise``：
  - 如果/当 ``resolvePromise``被调用且参数为``y``，则继续调用``[[Resolve]](promise, y)``
  - 如果/当``rejectPromise``被调用且理由为``r``，则用``r``拒绝掉``promise``
  - 如果``rejectPromise``和``resolvePromise``都被调用过，则只采用第一次调用来应用前两个准则
  - 如果在调用``then``方法时遇到了错误``e``:
    - 如果``resolvePromise``或这``rejectPromise``被调用过，则运用之前的规则并忽略``e``
    - 其他情况下用``e`` reject ``promise``

2.3.4 如果``x``不是一个对象或者方法，则用``x`` fulfilled ``promise``
