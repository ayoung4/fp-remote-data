import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as T from 'fp-ts/lib/These';
import { pipe } from 'fp-ts/lib/function';

import * as _ from '../src/RefreshableData';

const p = (n: number): boolean => n > 2

describe('RefreshableData', () => {
    describe('pipeables', () => {
        it('map', () => {
            const double = (n: number) => n * 2
            assert.deepStrictEqual(pipe(_.success(2, false), _.map(double)), _.success(4, false))
            assert.deepStrictEqual(pipe(_.failure(2, false), _.map(double)), _.failure(2, false))
        })

        it('ap', () => {
            const double = (n: number) => n * 2
            assert.deepStrictEqual(pipe(_.success(double, false), _.ap(_.success(2, false))), _.success(4, false))
            assert.deepStrictEqual(pipe(_.success(double, false), _.ap(_.failure(2, false))), _.failure(2, false))
            assert.deepStrictEqual(pipe(_.failure(2, false), _.ap(_.success(2, false))), _.failure(2, false))
            assert.deepStrictEqual(pipe(_.failure(2, false), _.ap(_.failure(2, false))), _.failure(2, false))
        })

        it('apFirst', () => {
            assert.deepStrictEqual(pipe(_.success('a', false), _.apFirst(_.success('b', false))), _.success('a', false))
        })

        it('apSecond', () => {
            assert.deepStrictEqual(pipe(_.success('a', false), _.apSecond(_.success('b', false))), _.success('b', false))
        })

        it('chain', () => {
            const f = (n: number) => _.success(n * 2, false)
            const g = () => _.failure(2, false)
            assert.deepStrictEqual(pipe(_.success(1, false), _.chain(f)), _.success(2, false))
            assert.deepStrictEqual(pipe(_.failure(1, false), _.chain(f)), _.failure(1, false))
            assert.deepStrictEqual(pipe(_.success(1, false), _.chain(g)), _.failure(2, false))
            assert.deepStrictEqual(pipe(_.failure(1, false), _.chain(g)), _.failure(1, false))
        })

        it('chainFirst', () => {
            const f = (n: number) => _.success(n * 2, false)
            assert.deepStrictEqual(pipe(_.success(1, false), _.chainFirst(f)), _.success(1, false))
        })

        it('flatten', () => {
            assert.deepStrictEqual(pipe(_.success(_.success(1, false), false), _.flatten), _.success(1, false))
        })

    })

    describe('constructors', () => {
        it('fromOption', () => {
            assert.deepStrictEqual(_.fromOption(() => 2)(O.none), _.failure(2, false))
            assert.deepStrictEqual(_.fromOption(() => 2)(O.some(1)), _.success(1, false))
        })
        it('fromEither', () => {
            assert.deepStrictEqual(_.fromEither(E.left('a')), _.failure('a', false))
            assert.deepStrictEqual(_.fromEither(E.right(1)), _.success(1, false))
        })
        it('fromThese', () => {
            assert.deepStrictEqual(_.fromThese(T.left('a')), _.failure('a', false))
            assert.deepStrictEqual(_.fromThese(T.right(1)), _.success(1, false))
            assert.deepStrictEqual(_.fromThese(T.both('a', 1)), _.both('a', 1, false))
        })
        it('fromPredicate', () => {
            const f = _.fromPredicate(p, () => 'failure')
            assert.deepStrictEqual(f(1), _.failure('failure', false))
            assert.deepStrictEqual(f(3), _.success(3, false))

            type Direction = 'asc' | 'desc'
            const parseDirection = _.fromPredicate(
                (s: string): s is Direction => s === 'asc' || s === 'desc',
                () => 'failure',
            )
            assert.deepStrictEqual(parseDirection('asc'), _.success('asc', false))
            assert.deepStrictEqual(parseDirection('foo'), _.failure('failure', false))
        })
    })

    it('fold', () => {
        const f = () => 'init';
        const g = () => 'pending';
        const h = (s: string) => `failure${s.length}`
        const i = (n: number) => `success${n}`
        const j = (s: string, n: number) => `both${s.length}${n}`
        const fold = _.fold<string, number, string>({
            init: f,
            pending: g,
            failure: h,
            success: i,
            both: j,
        })
        assert.deepStrictEqual(fold(_.init()), 'init')
        assert.deepStrictEqual(fold(_.pending()), 'pending')
        assert.deepStrictEqual(fold(_.failure('abc', false)), 'failure3')
        assert.deepStrictEqual(fold(_.success(3, false)), 'success3')
        assert.deepStrictEqual(fold(_.both('abc', 3, false)), 'both33')
    })

})
