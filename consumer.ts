import * as amqplib from 'amqplib/callback_api';

let dataArray: { station_id: number; temperature: number; humidity: number; radiation: number }[] = [];

async function connect() {
  try {
    await amqplib.connect("amqp://52.6.228.180/", (err: any, conn: amqplib.Connection) => {
      if (err) throw err;

      conn.createChannel((errChanel: any, channel: amqplib.Channel) => {
        if (errChanel) throw new Error(errChanel);

        channel.assertQueue();

        setInterval(() => {
          channel.consume("data", async (data: amqplib.Message | null) => {
            if (data?.content !== undefined) {
              console.log(`Solicitud de pago: ${data.content}`);
              const content = data?.content;
              const parsedContent = JSON.parse(content.toString());

              dataArray.push({
                station_id: parsedContent.station_id,
                temperature: parsedContent.temperature,
                humidity: parsedContent.humidity,
                radiation: parsedContent.radiation,
              });

              await channel.ack(data);

              console.log(dataArray)
            }
          });

          console.log("Enviando datos a la API...");
          fetch("http://localhost:3001/data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataArray),
          })
            .then(() => {
              console.log("Datos enviados exitosamente");
              dataArray = [];
            })
            .catch((err: any) => {
              throw err;
            });
        }, 30000);
      });
    });
  } catch (err: any) {
    throw err;
  }
}

connect();