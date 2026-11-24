package es.tuttidolce.api.comun;

import java.security.SecureRandom;
import java.util.HexFormat;

/** Generación de tokens y códigos aleatorios. */
public final class Codigos {

    private static final SecureRandom AZAR = new SecureRandom();
    /** Sin 0/O ni 1/I para que se puedan dictar por teléfono. */
    private static final char[] LEGIBLES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private Codigos() {}

    /** Token de 256 bits en hexadecimal (enlaces de confirmación y baja). */
    public static String token() {
        byte[] bytes = new byte[32];
        AZAR.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** Código corto legible, p. ej. para descuentos o diseños compartidos. */
    public static String corto(int longitud) {
        StringBuilder sb = new StringBuilder(longitud);
        for (int i = 0; i < longitud; i++) {
            sb.append(LEGIBLES[AZAR.nextInt(LEGIBLES.length)]);
        }
        return sb.toString();
    }
}
