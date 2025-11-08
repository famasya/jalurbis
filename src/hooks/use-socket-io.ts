import { useQuery } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { randomBytes } from "node:crypto"
import z from "zod"
import { upfetch } from "~/utils/upfetch"

const baseUrl = `https://gps.brtnusantara.com:5100/socket.io`

const socketProxy = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data }): Promise<{ sequence: null | number, payload: null | string }> => {
    try {

      const response = await upfetch<string>(`${baseUrl}/${data}`)
      console.log(response, 321)

      // parse payload. first element before `{` is a sequence
      const delimiterPos = response.indexOf(`{`)
      if (!delimiterPos) {
        return {
          sequence: null,
          payload: null
        }
      }
      const sequence = response.substring(0, delimiterPos);
      const payload = response.substring(delimiterPos);
      return {
        sequence: Number(sequence),
        payload
      }
    } catch (e) {
      console.error(`cannot parse socket ${e}`)
      return {
        sequence: null,
        payload: null
      }
    }
  })

const generateWebSocketKey = createServerFn()
  .handler(() => {
    return randomBytes(16).toString('base64');
  })

const handshakeSchema = z.object({
  sid: z.string(),
  pingInterval: z.number(),
})
const namespaceSchema = handshakeSchema.pick({
  sid: true
})
const useSocketHandshake = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["handshake"],
    queryFn: async () => {
      const response = await socketProxy({
        data: "?transport=polling&b64=1&EIO=4"
      })

      // validate handshake
      const { error, data } = handshakeSchema.safeParse(response.payload)
      if (error) {
        throw new Error(`Invalid handshake: ${z.treeifyError(error).errors.join(", ")}`)
      }

      // join namespace
      const [namespace, wsKey] = await Promise.all([socketProxy({
        data: `?transport=polling&b64=1&EIO=4&sid=${data.sid}`
      }), generateWebSocketKey])

      // validate namespace
      const { error: namespaceError, data: namespaceData } = namespaceSchema.safeParse(namespace.payload)
      if (namespaceError) {
        throw new Error(`Invalid handshake: ${z.treeifyError(namespaceError).errors.join(", ")}`)
      }

      return {
        sid: namespaceData.sid,
        wsKey,
      }
    }
  })

  return {
    data,
    isLoading
  }
}

export const useSocketIO = () => {

  // initiate handshake
  const { data } = useSocketHandshake()
}
