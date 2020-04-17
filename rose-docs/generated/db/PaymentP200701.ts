// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface PaymentP200701Row {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200701InsertRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200701 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<number>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_01', $tableAlias));
	}

}

export const QPaymentP200701 = rose.deepFreeze(new TPaymentP200701());
export const PaymentP200701AllColumns = {
	amount: QPaymentP200701.amount,
	customerId: QPaymentP200701.customerId,
	paymentDate: QPaymentP200701.paymentDate,
	paymentId: QPaymentP200701.paymentId,
	rentalId: QPaymentP200701.rentalId,
	staffId: QPaymentP200701.staffId,
};
export const PaymentP200701DefaultQueries = {
	insertOne: function updateOne(row: PaymentP200701InsertRow) {
		return rose.insertFromObject<TPaymentP200701, PaymentP200701InsertRow, {}>(QPaymentP200701, row).prepare();
	},
};
