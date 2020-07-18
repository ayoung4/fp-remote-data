import { pipeable } from 'fp-ts/lib/pipeable';
import * as T from 'fp-ts/lib/These';
import { Functor2 } from 'fp-ts/lib/Functor';
import { Bifunctor2 } from 'fp-ts/lib/Bifunctor';
import { Chain2 } from 'fp-ts/lib/Chain';
import { MonadThrow2 } from 'fp-ts/lib/MonadThrow';

export const URI = 'RefreshableData';
export type URI = typeof URI;

enum Tags {
    init = 'init',
    pending = 'pending',
    success = 'success',
    failure = 'failure',
    both = 'both',
}

type Init = {
    readonly _tag: Tags.init,
};

type Pending = {
    readonly _tag: Tags.pending,
};

type Success<A> = {
    readonly _tag: Tags.success,
    readonly result: A,
    readonly refreshing: boolean;
};

type Failure<E> = {
    readonly _tag: Tags.failure,
    readonly error: E,
    readonly refreshing: boolean;
};

type Both<E, A> = {
    readonly _tag: Tags.both,
    readonly error: E,
    readonly result: A,
    readonly refreshing: boolean;
};

export type RefreshableData<E, A> = Init | Pending | Failure<E> | Success<A> | Both<E, A>;

export const init = (): Init => ({
    _tag: Tags.init,
});

export const pending = (): Pending => ({
    _tag: Tags.pending,
});

export const failure = <E>(error: E, refreshing: boolean): Failure<E> => ({
    _tag: Tags.failure,
    error,
    refreshing,
});

export const success = <A>(result: A, refreshing: boolean): Success<A> => ({
    _tag: Tags.success,
    result,
    refreshing,
});

export const both = <E, A>(error: E, result: A, refreshing: boolean): Both<E, A> => ({
    _tag: Tags.both,
    error,
    result,
    refreshing,
});

export const fold = <E, A, B>(m: {
    [Tags.init](): B,
    [Tags.pending](): B,
    [Tags.failure](e: E, refreshing: boolean): B,
    [Tags.success](a: A, refreshing: boolean): B,
    [Tags.both](e: E, a: A, refreshing: boolean): B,
}) => (rd: RefreshableData<E, A>) => {
    switch (rd._tag) {
        case Tags.init:
            return m[Tags.init]();
        case Tags.pending:
            return m[Tags.pending]();
        case Tags.failure:
            return m[Tags.failure](rd.error, rd.refreshing);
        case Tags.success:
            return m[Tags.success](rd.result, rd.refreshing);
        case Tags.both:
            return m[Tags.both](rd.error, rd.result, rd.refreshing);
    }
};

export const transition = <E, A>(m: Partial<{
    [Tags.init](): RefreshableData<E, A>,
    [Tags.pending](): RefreshableData<E, A>,
    [Tags.failure](e: E, refreshing: boolean): RefreshableData<E, A>,
    [Tags.success](a: A, refreshing: boolean): RefreshableData<E, A>,
    [Tags.both](e: E, a: A, refreshing: boolean): RefreshableData<E, A>,
}>) => fold({
    [Tags.init]: init,
    [Tags.pending]: pending,
    [Tags.failure]: failure,
    [Tags.success]: success,
    [Tags.both]: both,
    ...m,
});

export const fromThese = <E, A>(fab: T.These<E, A>) =>
    T.fold<E, A, RefreshableData<E, A>>(
        (e) => failure(e, false),
        (a) => success(a, false),
        (e, a) => both(e, a, false),
    )(fab);

declare module 'fp-ts/lib/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: RefreshableData<E, A>;
    }
}

const map_: Functor2<URI>['map'] = <E, A, B>(fa: RefreshableData<E, A>, f: (a: A) => B) =>
    fold<E, A, RefreshableData<E, B>>({
        init,
        pending,
        failure,
        success: (result, refreshing) => success(f(result), refreshing),
        both: (error, result, refreshing) => both(error, f(result), refreshing),
    })(fa);

const mapLeft_: Bifunctor2<URI>['mapLeft'] = <E, A, G>(fa: RefreshableData<E, A>, f: (e: E) => G) =>
    fold<E, A, RefreshableData<G, A>>({
        init,
        pending,
        failure: (error, refreshing) => failure(f(error), refreshing),
        success,
        both: (error, result, refreshing) => both(f(error), result, refreshing),
    })(fa);

const bimap_: Bifunctor2<URI>['bimap'] = <E, A, G, B>(fea: RefreshableData<E, A>, f: (e: E) => G, g: (a: A) => B) =>
    fold<E, A, RefreshableData<G, B>>({
        init,
        pending,
        failure: (error, refreshing) => failure(f(error), refreshing),
        success: (result, refreshing) => success(g(result), refreshing),
        both: (error, result, refreshing) => both(f(error), g(result), refreshing),
    })(fea);

const chain_: Chain2<URI>['chain'] = <E, A, B>(fa: RefreshableData<E, A>, f: (a: A) => RefreshableData<E, B>) =>
    fold<E, A, RefreshableData<E, B>>({
        init,
        pending,
        failure,
        success: f,
        both: (_, result) => f(result),
    })(fa);

const ap_: Chain2<URI>['ap'] = <E, A, B>(fab: RefreshableData<E, (a: A) => B>, fa: RefreshableData<E, A>) =>
    fold<E, (a: A) => B, RefreshableData<E, B>>({
        init,
        pending,
        failure,
        success: (f, abRefreshing) => fold<E, A, RefreshableData<E, B>>({
            init,
            pending,
            failure,
            success: (result, aRefreshing) => success(f(result), abRefreshing || aRefreshing),
            both: (error, result, aRefreshing) => both(error, f(result), abRefreshing || aRefreshing),
        })(fa),
        both: (abError, f, abRefreshing) => fold<E, A, RefreshableData<E, B>>({
            init,
            pending,
            failure,
            success: (result, aRefreshing) => both(abError, f(result), abRefreshing || aRefreshing),
            both: (error, result, aRefreshing) => both(error, f(result), abRefreshing || aRefreshing),
        })(fa),
    })(fab);
export const Functor: Functor2<URI> = {
    URI,
    map: map_,
};

export const Bifunctor: Bifunctor2<URI> = {
    URI,
    mapLeft: mapLeft_,
    bimap: bimap_,
};

export const Chain: Chain2<URI> = {
    URI,
    ap: ap_,
    map: map_,
    chain: chain_,
};

export const MonadThrow: MonadThrow2<URI> = {
    URI,
    ap: ap_,
    map: map_,
    chain: chain_,
    of: (a) => success(a, false),
    throwError: (e) => failure(e, false),
};

export const remoteData: Functor2<URI>
    & Bifunctor2<URI>
    & Chain2<URI>
    & MonadThrow2<URI>
    = {
    ...Functor,
    ...Bifunctor,
    ...Chain,
    ...MonadThrow,
};

export const {
    map,
    mapLeft,
    bimap,
    ap,
    apFirst,
    apSecond,
    chain,
    chainFirst,
    flatten,
    filterOrElse,
    fromEither,
    fromOption,
    fromPredicate,
} = pipeable({
    ...Functor,
    ...Bifunctor,
    ...Chain,
    ...MonadThrow,
});
