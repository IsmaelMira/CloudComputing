CREATE TABLE IF NOT EXISTS resultados (
  usuario varchar(500) NOT NULL,
  key varchar(500) NOT NULL,
  status varchar(20) NOT NULL,
  PRIMARY KEY (usuario, key)
);
