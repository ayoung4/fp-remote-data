import { identity } from 'fp-ts/lib/function';

export enum Tags {
    init = 'init',
    pending = 'pending',
    success = 'success',
    failure = 'failure',
}

type Init = {
    _tag: Tags.init,
};

type Pending = {
    _tag: Tags.pending,
};

type Success<A> = {
    _tag: Tags.success,
    result: A,
};

type Failure<E> = {
    _tag: Tags.failure,
    error: E,
};

export type RemoteData<E, A> = Init | Pending | Failure<E> | Success<A>;

export const init: Init = {
    _tag: Tags.init,
};

export const pending: Pending = {
    _tag: Tags.pending,
};

export const failure = <E>(error: E): Failure<E> => ({
    _tag: Tags.failure,
    error,
});

export const success = <A>(result: A): Success<A> => ({
    _tag: Tags.success,
    result,
});

export const fold = <E, A, B>(m: {
    [Tags.init](rd: Init): B,
    [Tags.pending](rd: Pending): B,
    [Tags.failure](rd: Failure<E>): B,
    [Tags.success](rd: Success<A>): B,
}) => (rd: RemoteData<E, A>) => {
    switch (rd._tag) {
        case Tags.init:
            return m[Tags.init](rd);
        case Tags.pending:
            return m[Tags.pending](rd);
        case Tags.failure:
            return m[Tags.failure](rd);
        case Tags.success:
            return m[Tags.success](rd);
    }
};

export const transition = <E, A>(m: Partial<{
    [Tags.init](rd: Init): RemoteData<E, A>,
    [Tags.pending](rd: Pending): RemoteData<E, A>,
    [Tags.failure](rd: Failure<E>): RemoteData<E, A>,
    [Tags.success](rd: Success<A>): RemoteData<E, A>,
}>) => fold({
    [Tags.init]: identity,
    [Tags.pending]: identity,
    [Tags.failure]: identity,
    [Tags.success]: identity,
    ...m,
});

export const map = <E, A, B>(f: (a: A) => B) =>
    fold<E, A, RemoteData<E, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => rd,
        success: (rd) => success(f(rd.result)),
    });

export const mapLeft = <E, A, B>(f: (a: E) => B) =>
    fold<E, A, RemoteData<B, A>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => failure(f(rd.error)),
        success: (rd) => rd,
    });

export const bimap = <E, A, F, B>(left: (e: E) => F, right: (a: A) => B) =>
    fold<E, A, RemoteData<F, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => failure(left(rd.error)),
        success: (rd) => success(right(rd.result)),
    });

export const chain = <E, A, B>(f: (a: A) => RemoteData<E, B>) =>
    fold<E, A, RemoteData<E, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => rd,
        success: (rd) => f(rd.result),
    });
