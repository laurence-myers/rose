// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface PaymentP200706Row {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200706InsertRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200706 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<number>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_06', $tableAlias));
	}

}

export const QPaymentP200706 = rose.deepFreeze(new TPaymentP200706());
export const PaymentP200706AllColumns = {
	amount: QPaymentP200706.amount,
	customerId: QPaymentP200706.customerId,
	paymentDate: QPaymentP200706.paymentDate,
	paymentId: QPaymentP200706.paymentId,
	rentalId: QPaymentP200706.rentalId,
	staffId: QPaymentP200706.staffId,
};
export const PaymentP200706DefaultQueries = {
	insertOne: function updateOne(row: PaymentP200706InsertRow) {
		return rose.insertFromObject<TPaymentP200706, PaymentP200706InsertRow, {}>(QPaymentP200706, row).prepare();
	},
};
