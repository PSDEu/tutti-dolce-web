package es.tuttidolce.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import es.tuttidolce.api.miembros.Miembro;
import es.tuttidolce.api.miembros.MiembroRepository;
import es.tuttidolce.api.miembros.MiembroService;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Pruebas de la API contra un PostgreSQL 19 real (Testcontainers, necesita Docker).
 * Brevo y n8n están desactivados: los emails solo se escriben en el log.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {"tutti.admin-key=clave-de-prueba", "tutti.email-pasteleria=pasteleria@ejemplo.test"})
@AutoConfigureMockMvc
class ApiIntegracionTest {

    private static final String CLAVE = "clave-de-prueba";

    @Autowired MockMvc mvc;
    @Autowired JsonMapper json;
    @Autowired MiembroRepository miembros;
    @Autowired MiembroService miembroService;

    private String pedido(boolean permitePublicar, LocalDate fecha, boolean privacidad) {
        return """
                {
                  "diseno": {"forma": "redonda", "tamano": "m", "bizcocho": "chocolate", "pisos": 2},
                  "ficha": [
                    {"etiqueta": "Forma", "valor": "Redonda"},
                    {"etiqueta": "Bizcocho", "valor": "Chocolate"},
                    {"etiqueta": "Cobertura", "valor": "Buttercream (#FBF3EA)"}
                  ],
                  "precioEstimado": 63.2,
                  "fechaEntrega": "%s",
                  "entrega": "RECOGIDA",
                  "nombre": "Ana",
                  "email": "Ana@Ejemplo.test",
                  "telefono": "600000000",
                  "imagen": "data:image/png;base64,iVBORw0KGgo=",
                  "permitePublicar": %s,
                  "aceptaPrivacidad": %s
                }
                """.formatted(fecha, permitePublicar, privacidad);
    }

    private LocalDate hoy() {
        return LocalDate.now(ZoneId.of("Europe/Madrid"));
    }

    private JsonNode crearPedido(boolean permitePublicar) throws Exception {
        String r = mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(permitePublicar, hoy().plusDays(5), true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("SOLICITADO"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(r);
    }

    @Test
    void crearYConsultarUnPedido() throws Exception {
        JsonNode p = crearPedido(false);
        String codigo = p.get("codigo").asString();
        assertThat(codigo).matches("TD-\\d{4}-\\d{5}");
        assertThat(p.get("email").asString()).isEqualTo("ana@ejemplo.test");
        assertThat(p.get("ficha")).hasSize(3);

        mvc.perform(get("/api/pedidos/" + codigo).header("X-Email", "ANA@ejemplo.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(codigo));
        mvc.perform(get("/api/pedidos/" + codigo).header("X-Token", p.get("tokenSeguimiento").asString()))
                .andExpect(status().isOk());
        mvc.perform(get("/api/pedidos/" + codigo).header("X-Email", "otra@ejemplo.test"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/pedidos/" + codigo)).andExpect(status().isNotFound());
    }

    @Test
    void rechazaDatosInvalidos() throws Exception {
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(pedido(false, hoy(), true)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(pedido(false, hoy().plusDays(5), false)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void elPanelNecesitaLaClave() throws Exception {
        mvc.perform(get("/api/admin/pedidos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/pedidos").header("X-Admin-Key", "otra")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/pedidos").header("X-Admin-Key", CLAVE)).andExpect(status().isOk());
    }

    @Test
    void cambiosDeEstadoRespetanElOrden() throws Exception {
        String id = crearPedido(false).get("id").asString();
        mvc.perform(patch("/api/admin/pedidos/" + id + "/estado").header("X-Admin-Key", CLAVE)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"estado\":\"LISTO\"}"))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/admin/pedidos/" + id + "/estado").header("X-Admin-Key", CLAVE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"CONFIRMADO\",\"precioConfirmado\":65,\"nota\":\"Con vela de regalo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONFIRMADO"))
                .andExpect(jsonPath("$.precioConfirmado").value(65))
                .andExpect(jsonPath("$.historial.length()").value(2))
                .andExpect(jsonPath("$.historial[1].nota").value("Con vela de regalo"));
    }

    @Test
    void soloSePublicanDisenosConPermisoYAprobados() throws Exception {
        crearPedido(false);
        crearPedido(true);
        String r = mvc.perform(get("/api/admin/disenos").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode lista = json.readTree(r);
        JsonNode pendiente = null;
        for (JsonNode d : lista) {
            if (!d.get("aprobado").asBoolean()) pendiente = d;
        }
        assertThat(pendiente).isNotNull();
        assertThat(pendiente.get("nombre").asString()).isEqualTo("Torta de chocolate con buttercream");

        String antes = mvc.perform(get("/api/disenos/publicos")).andReturn().getResponse().getContentAsString();
        mvc.perform(patch("/api/admin/disenos/" + pendiente.get("id").asString()).header("X-Admin-Key", CLAVE)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"aprobado\":true}"))
                .andExpect(jsonPath("$.aprobado").value(true));
        String despues = mvc.perform(get("/api/disenos/publicos")).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(despues).size()).isEqualTo(json.readTree(antes).size() + 1);

        // Borrador para redes: n8n lo crea, la dueña lo aprueba.
        String b = mvc.perform(post("/api/admin/borradores").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"disenoCodigo\":\"%s\",\"red\":\"instagram\",\"texto\":\"¡Mirad qué torta!\"}"
                                .formatted(pendiente.get("codigo").asString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andReturn().getResponse().getContentAsString();
        String idBorrador = json.readTree(b).get("id").asString();
        mvc.perform(patch("/api/admin/borradores/" + idBorrador).header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"¡Mirad qué torta tan bonita!\",\"estado\":\"APROBADO\"}"))
                .andExpect(jsonPath("$.estado").value("APROBADO"))
                .andExpect(jsonPath("$.texto").value("¡Mirad qué torta tan bonita!"));
        mvc.perform(patch("/api/admin/borradores/" + idBorrador).header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"otro\",\"estado\":\"RECHAZADO\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void noHayBorradoresDeDisenosSinAprobar() throws Exception {
        mvc.perform(post("/api/admin/borradores").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"disenoCodigo\":\"D-NOEXISTE\",\"red\":\"instagram\",\"texto\":\"hola\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void membresiaConDobleOptInYBaja() throws Exception {
        String email = "luis@ejemplo.test";
        mvc.perform(post("/api/miembros").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nombre":"Luis","email":"%s","cumpleDia":30,"cumpleMes":2,"aceptaNewsletter":true,"aceptaPrivacidad":true}
                        """.formatted(email)))
                .andExpect(status().isBadRequest()); // 30 de febrero no existe

        mvc.perform(post("/api/miembros").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nombre":"Luis","email":"%s","cumpleDia":12,"cumpleMes":5,"aceptaNewsletter":true,"aceptaPrivacidad":true}
                        """.formatted(email)))
                .andExpect(status().isAccepted());
        Miembro m = miembros.findByEmail(email).orElseThrow();
        assertThat(m.getEstado()).isEqualTo(Miembro.Estado.PENDIENTE);

        mvc.perform(post("/api/miembros/confirmar").contentType(MediaType.APPLICATION_JSON).content("{\"token\":\"falso\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/miembros/confirmar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + m.getTokenConfirmacion() + "\"}"))
                .andExpect(status().isNoContent());
        assertThat(miembros.findByEmail(email).orElseThrow().getEstado()).isEqualTo(Miembro.Estado.CONFIRMADO);

        mvc.perform(post("/api/miembros/baja").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + m.getTokenBaja() + "\"}"))
                .andExpect(status().isNoContent());
        Miembro baja = miembros.findByEmail(email).orElseThrow();
        assertThat(baja.getEstado()).isEqualTo(Miembro.Estado.BAJA);
        assertThat(baja.isAceptaNewsletter()).isFalse();
    }

    @Test
    void regaloDeCumpleanosUnaVezAlAnio() throws Exception {
        LocalDate hoy = hoy();
        String email = "cumple@ejemplo.test";
        mvc.perform(post("/api/miembros").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nombre":"Marta","email":"%s","cumpleDia":%d,"cumpleMes":%d,"aceptaNewsletter":true,"aceptaPrivacidad":true}
                        """.formatted(email, hoy.getDayOfMonth(), hoy.getMonthValue())))
                .andExpect(status().isAccepted());
        Miembro m = miembros.findByEmail(email).orElseThrow();
        mvc.perform(post("/api/miembros/confirmar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + m.getTokenConfirmacion() + "\"}"));

        assertThat(miembroService.enviarRegalosDeCumpleanos()).isGreaterThanOrEqualTo(1);
        assertThat(miembros.findByEmail(email).orElseThrow().getUltimoRegaloAnio()).isEqualTo(hoy.getYear());
        assertThat(miembroService.enviarRegalosDeCumpleanos()).isZero();
    }
}
