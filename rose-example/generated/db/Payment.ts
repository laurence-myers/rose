// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface PaymentRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentInsertRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPayment extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<number>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment', $tableAlias));
	}

}

export const QPayment = rose.deepFreeze(new TPayment());
export const PaymentAllColumns = {
	amount: QPayment.amount,
	customerId: QPayment.customerId,
	paymentDate: QPayment.paymentDate,
	paymentId: QPayment.paymentId,
	rentalId: QPayment.rentalId,
	staffId: QPayment.staffId,
};
export const PaymentDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			paymentId: number;
		}

		const P = rose.params<Params>();
		return rose.select(PaymentAllColumns).where(QPayment.paymentId.eq(P.paymentId)).finalise(P);
	})(),
	insertOne: function insertOne(row: PaymentInsertRow) {
		return rose.insertFromObject<TPayment, PaymentInsertRow>(QPayment, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TPayment>) {
		interface Params {
			paymentId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QPayment, updates).where(QPayment.paymentId.eq(P.paymentId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			paymentId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QPayment).where(QPayment.paymentId.eq(P.paymentId)).finalise(P);
	})(),
};
