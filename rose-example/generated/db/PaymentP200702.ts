// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface PaymentP200702Row {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200702InsertRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200702 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<number>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_02', $tableAlias));
	}

}

export const QPaymentP200702 = rose.deepFreeze(new TPaymentP200702());
export const PaymentP200702AllColumns = {
	amount: QPaymentP200702.amount,
	customerId: QPaymentP200702.customerId,
	paymentDate: QPaymentP200702.paymentDate,
	paymentId: QPaymentP200702.paymentId,
	rentalId: QPaymentP200702.rentalId,
	staffId: QPaymentP200702.staffId,
};
export const PaymentP200702DefaultQueries = {
	insertOne: function insertOne(row: PaymentP200702InsertRow) {
		return rose.insertFromObject<TPaymentP200702, PaymentP200702InsertRow>(QPaymentP200702, row).finalise({});
	},
};
