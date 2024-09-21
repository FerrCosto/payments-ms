import { HttpStatus, Injectable } from '@nestjs/common';
import { PaymentSessionDto } from './dto/create-payment.dto';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { error } from 'console';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret_clave);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    try {
      const { currency, items } = paymentSessionDto;

      const lineItemms = items.map((item) => ({
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
            images: item.images,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));
      const session = await this.stripe.checkout.sessions.create({
        payment_intent_data: {
          metadata: {},
        },
        line_items: lineItemms,
        mode: 'payment',
        success_url: envs.stripe_success_url,
        cancel_url: envs.stripe_cancel_url,
      });
      return {
        cancelUrl: session.cancel_url,
        successUrl: session.success_url,
        url: session.url,
      };
    } catch (erorr) {
      console.log(error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Error:  ${erorr}`,
      });
    }
  }
}
