// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface PaymentP200704Row {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200704InsertRow {
	amount: number;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200704 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<number>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_04', $tableAlias));
	}

}

export const QPaymentP200704 = rose.deepFreeze(new TPaymentP200704());
export const PaymentP200704AllColumns = {
	amount: QPaymentP200704.amount,
	customerId: QPaymentP200704.customerId,
	paymentDate: QPaymentP200704.paymentDate,
	paymentId: QPaymentP200704.paymentId,
	rentalId: QPaymentP200704.rentalId,
	staffId: QPaymentP200704.staffId,
};
export const PaymentP200704DefaultQueries = {
	insertOne: function updateOne(row: PaymentP200704InsertRow) {
		return rose.insertFromObject<TPaymentP200704, PaymentP200704InsertRow, {}>(QPaymentP200704, row).prepare();
	},
};
