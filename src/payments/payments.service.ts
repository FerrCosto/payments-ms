import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PaymentSessionDto } from './dto/create-payment.dto';
import Stripe from 'stripe';
import { envs, NATS_SERVICE } from 'src/config';
import { error } from 'console';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret_clave);
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}
  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    try {
      const { currency, items, orderId } = paymentSessionDto;

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
          metadata: {
            orderId: orderId,
          },
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

  stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const endPoint = envs.webhook_stripe;
    let event: Stripe.Event;
    console.log(endPoint);
    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endPoint,
      );
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Webhook error ${error}`,
      });
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucced = event.data.object;
        const payload = {
          stripePaymentId: chargeSucced.id,
          orderId: chargeSucced.metadata.orderId,
        };
        console.log(payload);
        this.client.emit('payment.succeded', payload);
        break;

      default:
        console.log(`Evento tipo ${event.type}`);
    }
    return res.status(200).json({ sig });
  }
}
