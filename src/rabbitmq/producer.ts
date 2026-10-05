import amqp from "amqplib";

export const sendToQueue = async (queue: string, data: any) => {
  const conn = await amqp.connect("amqp://localhost");
  const channel = await conn.createChannel();

  await channel.assertQueue(queue);

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
};