import { expect } from 'chai';
import { describe, it } from 'mocha';
import { pipe, identity, flow } from 'fp-ts/lib/function';

import * as RD from '../src/RefreshableData';

describe('RefreshableData', function () {

    describe('constructors', function () {

        it('creates a failure state', function () {

            const err = 'an error';
            const refreshing = false;
            const failure = RD.failure(err, refreshing);
            expect(failure._tag).to.equal(RD.Tags.failure);
            expect(failure.error).to.equal(err);
            expect(failure.refreshing).to.equal(refreshing);

        });

        it('creates a success state', function () {

            const res = 'a result';
            const refreshing = false;
            const failure = RD.success(res, refreshing);
            expect(failure._tag).to.equal(RD.Tags.success);
            expect(failure.result).to.equal(res);
            expect(failure.refreshing).to.equal(refreshing);

        });

        it('creates a both state', function () {

            const err = 'an error';
            const res = 'a result';
            const refreshing = false;
            const failure = RD.both(err, res, refreshing);
            expect(failure._tag).to.equal(RD.Tags.both);
            expect(failure.result).to.equal(res);
            expect(failure.refreshing).to.equal(refreshing);

        });

    });

    describe('functor', function () {

        it('has identity', function () {

            const A = RD.success(10, false);
            const left = pipe(
                A,
                RD.map(identity),
            );

            expect(left).to.deep.equal(A);

        });

        it('has composition', function () {

            const f = (x: number) => x + 5;
            const g = String;
            const A = RD.success(10, false);
            const left = pipe(
                A,
                RD.map(f),
                RD.map(g),
            );
            const right = pipe(
                A,
                RD.map(flow(f, g)),
            );

            expect(left).to.deep.equal(right);

        });

    });

    describe('foldable', function () {

        it('folds all states', function () {

            const A = RD.init;
            const B = RD.pending;
            const C = RD.failure(10, false);
            const D = RD.success(15, false);
            const E = RD.both(10, 15, false);
            const f = RD.fold<number, number, number>({
                init: () => 5,
                pending: () => 7,
                failure: ({ error }) => error,
                success: ({ result }) => result,
                both: ({ error, result }) => error + result,
            })

            expect(f(A)).to.deep.equal(5);
            expect(f(B)).to.deep.equal(7);
            expect(f(C)).to.deep.equal(10);
            expect(f(D)).to.deep.equal(15);
            expect(f(E)).to.deep.equal(25);

        });

    });

});