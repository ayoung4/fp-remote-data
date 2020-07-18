import { flow } from 'fp-ts/lib/function';
import { pipeable } from 'fp-ts/lib/pipeable';
import { Functor2 } from 'fp-ts/lib/Functor';
import { Bifunctor2 } from 'fp-ts/lib/Bifunctor';
import { Chain2 } from 'fp-ts/lib/Chain';
import { MonadThrow2 } from 'fp-ts/lib/MonadThrow';

export const URI = 'RemoteData';
export type URI = typeof URI;

enum Tags {
    init = 'init',
    pending = 'pending',
    success = 'success',
    failure = 'failure',
}

type Init = {
    readonly _tag: Tags.init;
};

type Pending = {
    readonly _tag: Tags.pending;
};

type Success<A> = {
    readonly _tag: Tags.success;
    readonly result: A;
};

type Failure<E> = {
    readonly _tag: Tags.failure;
    readonly error: E;
};

export type RemoteData<E, A> = Init | Pending | Failure<E> | Success<A>;

export const init = (): Init => ({
    _tag: Tags.init,
});

export const pending = (): Pending => ({
    _tag: Tags.pending,
});

export const failure = <E>(error: E): Failure<E> => ({
    _tag: Tags.failure,
    error,
});

export const success = <A>(result: A): Success<A> => ({
    _tag: Tags.success,
    result,
});

export const fold = <E, A, B>(m: {
    [Tags.init](): B;
    [Tags.pending](): B;
    [Tags.failure](e: E): B;
    [Tags.success](a: A): B;
}) => (rd: RemoteData<E, A>) => {
    switch (rd._tag) {
        case Tags.init:
            return m[Tags.init]();
        case Tags.pending:
            return m[Tags.pending]();
        case Tags.failure:
            return m[Tags.failure](rd.error);
        case Tags.success:
            return m[Tags.success](rd.result);
    }
};

export const transition = <E, A>(m: Partial<{
    [Tags.init](): RemoteData<E, A>;
    [Tags.pending](): RemoteData<E, A>;
    [Tags.failure](e: E): RemoteData<E, A>;
    [Tags.success](a: A): RemoteData<E, A>;
}>) => fold({
    [Tags.init]: init,
    [Tags.pending]: pending,
    [Tags.failure]: failure,
    [Tags.success]: success,
    ...m,
});

declare module 'fp-ts/lib/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: RemoteData<E, A>;
    }
}

const map_: Functor2<URI>['map'] = <E, A, B>(fa: RemoteData<E, A>, f: (a: A) => B) =>
    fold<E, A, RemoteData<E, B>>({
        init,
        pending,
        failure,
        success: flow(f, success),
    })(fa);

const mapLeft_: Bifunctor2<URI>['mapLeft'] = <E, A, G>(fa: RemoteData<E, A>, f: (e: E) => G) =>
    fold<E, A, RemoteData<G, A>>({
        init,
        pending,
        failure: flow(f, failure),
        success,
    })(fa);

const bimap_: Bifunctor2<URI>['bimap'] = <E, A, G, B>(fea: RemoteData<E, A>, f: (e: E) => G, g: (a: A) => B) =>
    fold<E, A, RemoteData<G, B>>({
        init,
        pending,
        failure: flow(f, failure),
        success: flow(g, success),
    })(fea);

const chain_: Chain2<URI>['chain'] = <E, A, B>(fa: RemoteData<E, A>, f: (a: A) => RemoteData<E, B>) =>
    fold<E, A, RemoteData<E, B>>({
        init,
        pending,
        failure,
        success: f,
    })(fa);

const ap_: Chain2<URI>['ap'] = <E, A, B>(fab: RemoteData<E, (a: A) => B>, fa: RemoteData<E, A>) =>
    fold<E, (a: A) => B, RemoteData<E, B>>({
        init,
        pending,
        failure,
        success: (f) => fold<E, A, RemoteData<E, B>>({
            init,
            pending,
            failure,
            success: flow(f, success),
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
    of: success,
    throwError: failure,
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
