// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface PaymentP200703Row {
	amount: string;
	customerId: number;
	paymentDate: Date;
	paymentId: number;
	rentalId: number;
	staffId: number;
}

export interface PaymentP200703InsertRow {
	amount: string;
	customerId: number;
	paymentDate: Date;
	paymentId?: number;
	rentalId: number;
	staffId: number;
}

export class TPaymentP200703 extends rose.QueryTable {
	amount = new rose.ColumnMetamodel<string>(this.$table, 'amount');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	paymentDate = new rose.ColumnMetamodel<Date>(this.$table, 'payment_date');
	paymentId = new rose.ColumnMetamodel<number>(this.$table, 'payment_id');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('payment_p2007_03', $tableAlias));
	}

}

export const QPaymentP200703 = rose.deepFreeze(new TPaymentP200703());
export const PaymentP200703AllColumns = {
	amount: QPaymentP200703.amount,
	customerId: QPaymentP200703.customerId,
	paymentDate: QPaymentP200703.paymentDate,
	paymentId: QPaymentP200703.paymentId,
	rentalId: QPaymentP200703.rentalId,
	staffId: QPaymentP200703.staffId,
};
export const PaymentP200703DefaultQueries = {
	insertOne: function insertOne(row: PaymentP200703InsertRow) {
		return rose.insertFromObject<TPaymentP200703, PaymentP200703InsertRow>(QPaymentP200703, row).finalise({});
	},
};
