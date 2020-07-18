import { expect } from 'chai';
import { describe, it } from 'mocha';
import { pipe, identity, flow } from 'fp-ts/lib/function';

import * as RD from '../src/RemoteData';

describe('RemoteData', function () {

    describe('constructors', function () {

        it('creates a failure state', function () {

            const err = 'an error';
            const failure = RD.failure(err);
            expect(failure._tag).to.equal(RD.Tags.failure);
            expect(failure.error).to.equal(err);

        });

        it('creates a success state', function () {

            const res = 'a result';
            const failure = RD.success(res);
            expect(failure._tag).to.equal(RD.Tags.success);
            expect(failure.result).to.equal(res);

        });

    });

    describe('functor', function () {

        it('has identity', function () {

            const A = RD.success(10);
            const left = pipe(
                A,
                RD.map(identity),
            );

            expect(left).to.deep.equal(A);

        });

        it('has composition', function () {

            const f = (x: number) => x + 5;
            const g = String;
            const A = RD.success(10);
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
            const C = RD.failure(10);
            const D = RD.success(15);
            const f = RD.fold({
                init: () => 5,
                pending: () => 7,
                failure: ({ error }) => error,
                success: ({ result }) => result,
            })

            expect(f(A)).to.deep.equal(5);
            expect(f(B)).to.deep.equal(7);
            expect(f(C)).to.deep.equal(10);
            expect(f(D)).to.deep.equal(15);

        });

    });

});