import * as amqplib from 'amqplib/callback_api';

async function connect() {
    try {
        await amqplib.connect(
            "amqp://localhost:5672",
            (err: any, conn: amqplib.Connection) => {
                if (err) throw err;
                conn.createChannel((errChanel: any, channel: amqplib.Channel) => {
                    if (errChanel) throw new Error(errChanel);
                    channel.assertQueue();
                    channel.consume("payments", async (data: amqplib.Message | null) => {
                        if (data?.content !== undefined) {
                            console.log(`Solicitud de pago: ${data.content}`);
                            const content = data?.content;
                            const parsedContent = JSON.parse(content.toString());
                            const headers = {
                                "Content-Type": "application/json",
                            };
                            const body = {
                                method: "POST",
                                headers,
                                body: JSON.stringify(parsedContent),
                            };
                            console.log(parsedContent);
                            fetch("http://localhost:3001/approved", body)
                                .then(() => {
                                    console.log("Cliente notificado exitosamente");
                                })
                                .catch((err: any) => {
                                    throw err;
                                }); 
                            await channel.ack(data);
                        }
                    });
                });
            }
        );
    } catch (err: any) {
        throw err;
    }
}

connect();