import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';

import * as _ from '../src/RemoteData';

const p = (n: number): boolean => n > 2

describe('RemoteData', () => {
    describe('pipeables', () => {
        it('map', () => {
            const double = (n: number) => n * 2
            assert.deepStrictEqual(pipe(_.success(2), _.map(double)), _.success(4))
            assert.deepStrictEqual(pipe(_.failure(2), _.map(double)), _.failure(2))
        })

        it('ap', () => {
            const double = (n: number) => n * 2
            assert.deepStrictEqual(pipe(_.success(double), _.ap(_.success(2))), _.success(4))
            assert.deepStrictEqual(pipe(_.success(double), _.ap(_.failure(2))), _.failure(2))
            assert.deepStrictEqual(pipe(_.failure(2), _.ap(_.success(2))), _.failure(2))
            assert.deepStrictEqual(pipe(_.failure(2), _.ap(_.failure(2))), _.failure(2))
        })

        it('apFirst', () => {
            assert.deepStrictEqual(pipe(_.success('a'), _.apFirst(_.success('b'))), _.success('a'))
        })

        it('apSecond', () => {
            assert.deepStrictEqual(pipe(_.success('a'), _.apSecond(_.success('b'))), _.success('b'))
        })

        it('chain', () => {
            const f = (n: number) => _.success(n * 2)
            const g = () => _.failure(2)
            assert.deepStrictEqual(pipe(_.success(1), _.chain(f)), _.success(2))
            assert.deepStrictEqual(pipe(_.failure(1), _.chain(f)), _.failure(1))
            assert.deepStrictEqual(pipe(_.success(1), _.chain(g)), _.failure(2))
            assert.deepStrictEqual(pipe(_.failure(1), _.chain(g)), _.failure(1))
        })

        it('chainFirst', () => {
            const f = (n: number) => _.success(n * 2)
            assert.deepStrictEqual(pipe(_.success(1), _.chainFirst(f)), _.success(1))
        })

        it('flatten', () => {
            assert.deepStrictEqual(pipe(_.success(_.success(1)), _.flatten), _.success(1))
        })

    })

    describe('constructors', () => {
        it('fromOption', () => {
            assert.deepStrictEqual(_.fromOption(() => 2)(O.none), _.failure(2))
            assert.deepStrictEqual(_.fromOption(() => 2)(O.some(1)), _.success(1))
        })
        it('fromEither', () => {
            assert.deepStrictEqual(_.fromEither(E.left('a')), _.failure('a'))
            assert.deepStrictEqual(_.fromEither(E.right(1)), _.success(1))
        })
        it('fromPredicate', () => {
            const f = _.fromPredicate(p, () => 'failure')
            assert.deepStrictEqual(f(1), _.failure('failure'))
            assert.deepStrictEqual(f(3), _.success(3))

            type Direction = 'asc' | 'desc'
            const parseDirection = _.fromPredicate(
                (s: string): s is Direction => s === 'asc' || s === 'desc',
                () => 'failure',
            )
            assert.deepStrictEqual(parseDirection('asc'), _.success('asc'))
            assert.deepStrictEqual(parseDirection('foo'), _.failure('failure'))
        })
    })

    it('fold', () => {
        const f = () => 'init';
        const g = () => 'pending';
        const h = (s: string) => `failure${s.length}`
        const i = (n: number) => `success${n}`
        const fold = _.fold<string, number, string>({
            init: f,
            pending: g,
            failure: h,
            success: i,
        })
        assert.deepStrictEqual(fold(_.init()), 'init')
        assert.deepStrictEqual(fold(_.pending()), 'pending')
        assert.deepStrictEqual(fold(_.failure('abc')), 'failure3')
        assert.deepStrictEqual(fold(_.success(3)), 'success3')
    })

})
