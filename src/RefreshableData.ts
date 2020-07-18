import { identity } from 'fp-ts/lib/function';

export enum Tags {
    init = 'init',
    pending = 'pending',
    success = 'success',
    failure = 'failure',
    both = 'both',
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
    refreshing: boolean;
};

type Failure<E> = {
    _tag: Tags.failure,
    error: E,
    refreshing: boolean;
};

type Both<E, A> = {
    _tag: Tags.both,
    error: E,
    result: A,
    refreshing: boolean;
};

export type RefreshableData<E, A> = Init | Pending | Failure<E> | Success<A> | Both<E, A>;

export const init: Init = {
    _tag: Tags.init,
};

export const pending: Pending = {
    _tag: Tags.pending,
};

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
    [Tags.init](rd: Init): B,
    [Tags.pending](rd: Pending): B,
    [Tags.failure](rd: Failure<E>): B,
    [Tags.success](rd: Success<A>): B,
    [Tags.both](rd: Both<E, A>): B,
}) => (rd: RefreshableData<E, A>) => {
    switch (rd._tag) {
        case Tags.init:
            return m[Tags.init](rd);
        case Tags.pending:
            return m[Tags.pending](rd);
        case Tags.failure:
            return m[Tags.failure](rd);
        case Tags.success:
            return m[Tags.success](rd);
        case Tags.both:
            return m[Tags.both](rd);
    }
};

export const transition = <E, A>(m: Partial<{
    [Tags.init](rd: Init): RefreshableData<E, A>,
    [Tags.pending](rd: Pending): RefreshableData<E, A>,
    [Tags.failure](rd: Failure<E>): RefreshableData<E, A>,
    [Tags.success](rd: Success<A>): RefreshableData<E, A>,
    [Tags.both](rd: Both<E, A>): RefreshableData<E, A>,
}>) => fold({
    [Tags.init]: identity,
    [Tags.pending]: identity,
    [Tags.failure]: identity,
    [Tags.success]: identity,
    [Tags.both]: identity,
    ...m,
});

export const map = <E, A, B>(f: (a: A) => B) =>
    fold<E, A, RefreshableData<E, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => rd,
        success: (rd) => success(f(rd.result), rd.refreshing),
        both: (rd) => both(rd.error, f(rd.result), rd.refreshing),
    });

export const mapLeft = <E, A, B>(f: (a: E) => B) =>
    fold<E, A, RefreshableData<B, A>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => failure(f(rd.error), rd.refreshing),
        success: (rd) => rd,
        both: (rd) => both(f(rd.error), rd.result, rd.refreshing),
    });

export const bimap = <E, A, F, B>(left: (e: E) => F, right: (a: A) => B) =>
    fold<E, A, RefreshableData<F, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => failure(left(rd.error), rd.refreshing),
        success: (rd) => success(right(rd.result), rd.refreshing),
        both: (rd) => both(left(rd.error), right(rd.result), rd.refreshing),
    });

export const chain = <E, A, B>(f: (a: A) => RefreshableData<E, B>) =>
    fold<E, A, RefreshableData<E, B>>({
        init: (rd) => rd,
        pending: (rd) => rd,
        failure: (rd) => rd,
        success: (rd) => f(rd.result),
        both: (rd) => f(rd.result),
    });
