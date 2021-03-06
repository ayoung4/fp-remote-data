# fp-remote-data

## Overview
A collection of ADTs representing data that must be fetched asynchronously, inspired by [@devexperts/remote-data-ts](https://github.com/devexperts/remote-data-ts). Provides a wider range of ADTs for more specific use cases, such as a feed that displays data that can be refreshed. Additionally, each ADT provides a transition function that makes it easy to use the ADT as an implementation of a finite state machine within a state management system such as redux. **WIP, NOT SAFE FOR PRODUCTION. Part of the fp-ts ecosystem.**

## Installation
npm:

    npm i --save fp-remote-data

yarn:

    yarn add fp-remote-data

## RemoteData

**Useful when loading data that should only be loaded once.**

### Description

A union type representing the following states:
- Initial
- Pending
- Failure
- Success

Implements the Bifunctor and MonadThrow interfaces in fp-ts.

### Constructors

    import * as RD from 'fp-remote-data/lib/RemoteData';
    import * as O from 'fp-ts/lib/Option';
    import * as E from 'fp-ts/lib/Either';
    
    type Name = { first: string; last: string; };
    
    const err: Error = new Error('something went wrong');
    const name: Name = { first: 'Alfred', last: 'Young' };
    
    type State = RD.RemoteData<Error, Name>;
    
    const init: State = RD.init(); // init
    const pending: State = RD.pending(); // pending
    const failure: State = RD.failure(err); // failure Error
    const success: State = RD.success(name); // success Name
    
    RD.fromOption(() => err)(O.none); // failure Error
    RD.fromOption(() => err)(O.some(name)); // success Name
    
    RD.fromEither(E.left(err)); // failure Error
    RD.fromEither(E.right(name)); // success Name

### Destructor
  
    const greet = RD.fold<Error, Name, string>({  
	    init: () => 'Not yet loaded.',
	    pending: () => 'Loading...',
	    failure: (err) => `Failed to load name: ${err.message}.`,
	    success: (result) => `Hello ${result.first}  ${result.last}!`,
    });
    
    greet(RD.init()) // Not yet loaded.
    greet(RD.pending()) // Loading...
    greet(RD.failure(err)) // Failed to load name: Error: something went wrong.
    greet(RD.success(name)) // Hello Alfred Young!

## RefreshableData

**Useful when data can be loaded and then later updated.**

### Description

A union type representing the following states:
- Initial
- Pending
- Failure
- Success
- Both

Implements the Bifunctor and MonadThrow interfaces in fp-ts.

### Constructors

Each constructor that accepts a value (`failure, success, both`) also requires an additional boolean argument that determines whether or not a state is refreshing.

    import * as RD from  'fp-remote-data/lib/RefreshableData';
    import * as O from  'fp-ts/lib/Option';
    import * as E from  'fp-ts/lib/Either';
    import * as T from  'fp-ts/lib/These';
    
    type Name = { first: string; last: string; };
    
    const err: Error = new  Error('something went wrong');
    const name: Name = { first: 'Alfred', last: 'Young' };
    
    type State = RD.RefreshableData<Error, Name>;
    
    const init: State = RD.init(); // init
    const pending: State = RD.pending(); // pending
    const failure: State = RD.failure(err, false); // failure Error, not refreshing
    const success: State = RD.success(name, false); // success Name, not refreshing
    const both: State = RD.both(err, name, false); // both Error, Name, not refreshing
      
    RD.fromOption(() => err)(O.none); // failure Error, not refreshing
    RD.fromOption(() => err)(O.some(name)); // success Name, not refreshing
    
    RD.fromEither(E.left(err)); // failure Error, not refreshing
    RD.fromEither(E.right(name)); // success Name, not refreshing
    
    RD.fromThese(T.left(err)); // failure Error, not refreshing
    RD.fromThese(T.right(name)); // success Name, not refreshing
    RD.fromThese(T.both(err, name)); // both Error, Name, not refreshing

### Destructor

    const greet = RD.fold<Error, Name, string>({
	    init: () => 'Not yet loaded.',
	    pending: () => 'Loading...',
	    failure: (e, refreshing) => `Failed to load name: ${e.message}, ${refreshing ? '' : 'not'} refreshing.`,
	    success: (res, refreshing) => `Hello ${res.first} ${res.last}, ${refreshing ? '' : 'not'} refreshing.`,
	    both: (e, res, refreshing) => `Failed to refresh name: ${e.message}. Hello ${res.first} ${res.last}!, ${refreshing ? '' : 'not'} refreshing.`,    
    });
    
    greet(RD.init()) // Not yet loaded.
    greet(RD.pending()) // Loading...
    greet(RD.failure(err, false)) // Failed to load name: Error: something went wrong, not refreshing.
    greet(RD.failure(err, true)) // Failed to load name: Error: something went wrong, refreshing.
    greet(RD.success(name, false)) // Hello Alfred Young, not refreshing.
    greet(RD.success(name, true)) // Hello Alfred Young, refreshing.
    greet(RD.both(err, name, false)) // Failed to refresh name: Error: something went wrong. Hello Alfred Young, not refreshing.
    greet(RD.both(err, name, true)) // Failed to refresh name: Error: something went wrong. Hello Alfred Young, refreshing.

## Planned: IncrementalData

**Useful when loading data who's progress can be observed.**

### Description

A union type representing the following states:
- Initial
- Pending
- Failure
- Success

## Planned: IncrementalRefreshableData

**Useful when loading data who's progress can be observed and when fully loaded can be later updated.**

### Description

A union type representing the following states:
- Initial
- Pending
- Failure
- Success
- Both

## Transition and use with Redux

Because each of these ADTs can be used as models for a state store, each ADT exports a transition function. The transition function is used to create state transitions between the ADT subtypes. Transition creates a function that accepts an ADT instance and returns a new ADT instance (aka a state transition). Transition accepts an object in which keys are ADT subtypes and values are functions from that subtype's value to a new ADT instance. Any ADT subtypes that are not included as keys in the argument are mapped back to their original values in the resulting function. 

### With RemoteData:

In the following example: 
- the reset action transitions all states to the initial state
- the fetch action transitions all states to the pending state
- the failure action transitions the pending state to the failure state and leaves all other states remained unchanged
- the success action transitions the pending state to the failure state and leaves all other states remained unchanged

Example:

    import { createSlice, PayloadAction } from '@reduxjs/toolkit';
    import * as RD from  'fp-remote-data/lib/RemoteData';

    type Todo = {
	    id: number;
	    description: string;
	    done: boolean;
    };
    
    type TodosState = RD.RemoteData<Error, Todo[]>
    
    export const todosSlice = createSlice({
	    name: 'todos',
	    initialState: RD.init() as TodosState,
	    reducers: {
            reset: RD.init,
            fetch: RD.pending,
            failure: (s, a: PayloadAction<{ error:  Error }>) =>
                RD.transition<Error, Todo[]>({
                    pending: () => RD.failure(a.payload.error),
                })(s as TodosState),
            success: (s, a: PayloadAction<{ result:  Todo[] }>) =>
                RD.transition<Error, Todo[]>({
                    pending: () => RD.success(a.payload.result),
                })(s as TodosState),
        },
    });

### With RefreshableData:

Example:

    import { createSlice, PayloadAction } from '@reduxjs/toolkit';
    import * as RD from 'fp-remote-data/lib/RefreshableData';

    type Todo = {
        id: number;
        description: string;
        done: boolean;
    };

    type TodosState = RD.RefreshableData<Error, Todo[]>

    export const todosSlice = createSlice({
        name: 'todos',
        initialState: RD.init() as TodosState,
        reducers: {
            reset: RD.init,
            fetch: (s) =>
                RD.transition<Error, Todo[]>({
                    init: RD.pending,
                    failure: (error) => RD.failure(error, true),
                    success: (result) => RD.success(result, true),
                    both: (error, result) => RD.both(error, result, true),
                })(s as TodosState),
            failure: (s, a: PayloadAction<{ error: Error }>) =>
                RD.transition<Error, Todo[]>({
                    pending: () => RD.failure(a.payload.error, false),                        
                    failure: () => RD.failure(a.payload.error, false),
                    success: (result) => RD.both(a.payload.error, result, false),
                    both: (_, result) => RD.both(a.payload.error, result, false),
                })(s as TodosState),
            success: (s, a: PayloadAction<{ result: Todo[] }>) =>
                RD.transition<Error, Todo[]>({
                    pending: () => RD.success(a.payload.result, false),
                    failure: () => RD.success(a.payload.result, false),
                    success: () => RD.success(a.payload.result, false),
                    both: () => RD.success(a.payload.result, false),
                })(s as TodosState),
        },
    });
