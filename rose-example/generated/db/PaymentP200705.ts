// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface PaymentP200705Row {
	amount: string;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200705InsertRow {
	amount: string;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200705 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<string>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_05', $tableAlias));
	}

}

export const QPaymentP200705 = rose.deepFreeze(new TPaymentP200705());
export const PaymentP200705AllColumns = {
	amount: QPaymentP200705.amount,
	customerId: QPaymentP200705.customerId,
	paymentDate: QPaymentP200705.paymentDate,
	paymentId: QPaymentP200705.paymentId,
	rentalId: QPaymentP200705.rentalId,
	staffId: QPaymentP200705.staffId,
};
export const PaymentP200705DefaultQueries = {
	insertOne: function insertOne(row: PaymentP200705InsertRow) {
		return rose.insertFromObject<TPaymentP200705, PaymentP200705InsertRow>(QPaymentP200705, row).finalise({});
	},
};
