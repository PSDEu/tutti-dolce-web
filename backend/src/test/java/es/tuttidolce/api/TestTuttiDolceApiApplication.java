package es.tuttidolce.api;

import org.springframework.boot.SpringApplication;

public class TestTuttiDolceApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(TuttiDolceApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
